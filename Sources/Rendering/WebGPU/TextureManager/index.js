import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

const { VtkDataTypes } = vtkDataArray;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWebGPUTextureManager methods
// ----------------------------------------------------------------------------

const HALF_FLOAT_EXACT_INTEGER_LIMIT = 2048;

// ----------------------------------------------------------------------------

function vtkWebGPUTextureManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureManager');

  function _formatPrefix(numberOfComponents) {
    switch (numberOfComponents) {
      case 1:
        return 'r';
      case 2:
        return 'rg';
      default:
        return 'rgba';
    }
  }

  function _getScalarState(scalars) {
    const scalarMTime = scalars.getMTime();
    let state = model.scalarFormats.get(scalars);
    if (state?.scalarMTime !== scalarMTime) {
      state = {
        contentTime: undefined,
        contentVersion: 0,
        halfFloatFitVersion: -1,
        formats: [],
        scalarMTime,
      };
      model.scalarFormats.set(scalars, state);
    }
    return state;
  }

  function _getCachedScalarFormat(scalars, preferSizeOverAccuracy) {
    const state = _getScalarState(scalars);
    const formatIndex = preferSizeOverAccuracy ? 1 : 0;
    const format = state.formats[formatIndex] ?? null;
    const formatNeedsHalfFloatFit =
      !preferSizeOverAccuracy && format?.endsWith('16float');
    if (
      formatNeedsHalfFloatFit &&
      state.halfFloatFitVersion !== state.contentVersion
    ) {
      return null;
    }
    return format;
  }

  function _cacheScalarFormat(scalars, format, preferSizeOverAccuracy) {
    const state = _getScalarState(scalars);
    const formatIndex = preferSizeOverAccuracy ? 1 : 0;
    state.formats[formatIndex] = format;
  }

  function _updateContentState(scalars, contentTime) {
    const state = _getScalarState(scalars);
    const previousContentFitsHalfFloat =
      state.halfFloatFitVersion === state.contentVersion;
    if (state.contentTime !== contentTime) {
      state.contentTime = contentTime;
      state.contentVersion++;
    }
    return { previousContentFitsHalfFloat, version: state.contentVersion };
  }

  function _markHalfFloatFit(scalars, version) {
    _getScalarState(scalars).halfFloatFitVersion = version;
  }

  function _formatMatchesDataArray(format, dataArray) {
    const numberOfComponents = dataArray.getNumberOfComponents();
    const textureComponents = numberOfComponents === 3 ? 4 : numberOfComponents;
    const formatDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(format);
    if (formatDetails?.numComponents !== textureComponents) {
      return false;
    }

    const dataType = dataArray.getDataType();
    const uses8BitNormalizedFormat =
      dataType === VtkDataTypes.UNSIGNED_CHAR ||
      dataType === VtkDataTypes.UNSIGNED_CHAR_CLAMPED;
    if (uses8BitNormalizedFormat) {
      return format.endsWith('8unorm');
    }
    return format.endsWith('16float') || format.endsWith('32float');
  }

  function _dataArrayFitsHalfFloat(dataArray) {
    const values = dataArray.getData();
    for (let i = 0; i < values.length; i++) {
      if (
        values[i] < -HALF_FLOAT_EXACT_INTEGER_LIMIT ||
        values[i] > HALF_FLOAT_EXACT_INTEGER_LIMIT
      ) {
        return false;
      }
    }
    return true;
  }

  function _updatedExtentsFitHalfFloat(dataArray, dimensions, extents) {
    const values = dataArray.getData();
    const numberOfComponents = dataArray.getNumberOfComponents();
    const rowLength = dimensions[0] * numberOfComponents;
    const sliceLength = dimensions[1] * rowLength;

    for (let extentIndex = 0; extentIndex < extents.length; extentIndex++) {
      const [xmin, xmax, ymin, ymax, zmin, zmax] = extents[extentIndex];
      const extentRowLength = (xmax - xmin + 1) * numberOfComponents;
      for (let z = zmin; z <= zmax; z++) {
        for (let y = ymin; y <= ymax; y++) {
          const start =
            z * sliceLength + y * rowLength + xmin * numberOfComponents;
          const end = start + extentRowLength;
          for (let i = start; i < end; i++) {
            if (
              values[i] < -HALF_FLOAT_EXACT_INTEGER_LIMIT ||
              values[i] > HALF_FLOAT_EXACT_INTEGER_LIMIT
            ) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  function _scalarFormatSuffix(req) {
    const dataType = req.dataArray.getDataType();
    if (
      dataType === VtkDataTypes.UNSIGNED_CHAR ||
      dataType === VtkDataTypes.UNSIGNED_CHAR_CLAMPED
    ) {
      return '8unorm';
    }

    if (req.forceFloat32) {
      return '32float';
    }

    if (
      !req.preferSizeOverAccuracy &&
      model.device.hasFeature('float32-filterable')
    ) {
      req.fitsHalfFloat = _dataArrayFitsHalfFloat(req.dataArray);
      return req.fitsHalfFloat ? '16float' : '32float';
    }

    return '16float';
  }

  // fills in request values based on what is missing/provided
  function _fillRequest(req) {
    // fill in values based on imageData if the request has it
    if (req.imageData) {
      req.dataArray = req.imageData.getPointData().getScalars();
      req.time = req.dataArray.getMTime();
      req.nativeArray = req.dataArray.getData();
      const dims = req.imageData.getDimensions();
      req.width = dims[0];
      req.height = dims[1];
      req.depth = dims[2];
      const numComp = req.dataArray.getNumberOfComponents();
      req.format = _formatPrefix(numComp);

      if (numComp === 3) {
        const source = req.nativeArray;
        const padded = macro.newTypedArray(
          source.constructor.name,
          (source.length / 3) * 4
        );
        const alpha = source.BYTES_PER_ELEMENT === 1 ? 255 : 1;
        for (let i = 0, j = 0; i < source.length; i += 3, j += 4) {
          padded[j] = source[i];
          padded[j + 1] = source[i + 1];
          padded[j + 2] = source[i + 2];
          padded[j + 3] = alpha;
        }
        req.nativeArray = padded;
      }

      if (req.existingFormat) {
        req.format = req.existingFormat;
      } else {
        req.format += _scalarFormatSuffix(req);
      }
    }

    // fill in values based on image if the request has it
    if (req.image) {
      req.width = req.image.width;
      req.height = req.image.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      req.usage =
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }

    // fill in based on js imageData
    if (req.jsImageData) {
      req.width = req.jsImageData.width;
      req.height = req.jsImageData.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      req.nativeArray = req.jsImageData.data;
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      req.usage =
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }

    if (req.imageBitmap) {
      req.width = req.imageBitmap.width;
      req.height = req.imageBitmap.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      req.usage =
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }

    if (req.canvas) {
      req.width = req.canvas.width;
      req.height = req.canvas.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      req.usage =
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }

    if (req.usage === undefined) {
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      req.usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }
  }

  // create a texture (used by getTexture)
  function _createTexture(req) {
    const newTex = vtkWebGPUTexture.newInstance({ label: req.label });

    newTex.create(model.device, {
      width: req.width,
      height: req.height,
      depth: req.depth,
      format: req.format,
      usage: req.usage,
      mipLevel: req.mipLevel,
    });

    // fill the texture if we have data
    if (req.nativeArray || req.image || req.canvas || req.imageBitmap) {
      newTex.writeImageData(req);
    }
    return newTex;
  }

  // A partial write requires the same texture size and format. writeTexture
  // cannot change the texture allocation.
  function _canPatchTexture(texture, req) {
    return (
      !!texture?.getHandle?.() &&
      texture.getFormat() === req.format &&
      texture.getWidth() === req.width &&
      texture.getHeight() === req.height &&
      texture.getDepth() === req.depth &&
      texture.getMipLevel?.() === (req.mipLevel ?? 0) &&
      texture.getUsage?.() === req.usage
    );
  }

  function _writeExtents(texture, req, extents) {
    const dims = [req.width, req.height, req.depth];
    for (let i = 0; i < extents.length; i++) {
      const extent = extents[i];
      const writeSucceeded = texture.writeSubImageData({
        x: extent[0],
        y: extent[2],
        z: extent[4],
        width: extent[1] - extent[0] + 1,
        height: extent[3] - extent[2] + 1,
        depth: extent[5] - extent[4] + 1,
        nativeArray: req.nativeArray,
        sourceLayout: {
          width: dims[0],
          height: dims[1],
          depth: dims[2],
          x: extent[0],
          y: extent[2],
          z: extent[4],
        },
        deferMipmaps: true,
      });
      if (writeSucceeded === false) {
        return false;
      }
    }
    texture.generateMipmaps?.();
    return true;
  }

  // get a texture or create it if not cached.
  // this is the main entry point
  publicAPI.getTexture = (req) => {
    // if we have a source then get/create/cache the texture
    if (req.hash) {
      // if a matching texture already exists then return it
      return model.device.getCachedObject(req.hash, _createTexture, req);
    }

    return _createTexture(req);
  };

  /**
   * Return a texture for an image. Patch `existingTexture` when
   * `updatedExtents` contains all modified regions.
   *
   * `preferSizeOverAccuracy` permits binary16 storage when the scalar range is
   * not exact in that format.
   * A partial update scans only its extents and keeps the existing format when
   * the scalar type is compatible and all updated values fit.
   */
  publicAPI.getTextureForImageData = (imgData, options = {}) => {
    const treq = { time: imgData.getMTime() };
    const { updatedExtents, existingTexture } = options;
    treq.imageData = imgData;
    treq.preferSizeOverAccuracy = !!options.preferSizeOverAccuracy;
    const scalars = imgData.getPointData().getScalars();
    const { previousContentFitsHalfFloat, version } = _updateContentState(
      scalars,
      imgData.getMTime()
    );
    if (updatedExtents?.length && existingTexture) {
      const existingFormat = existingTexture.getFormat();
      if (_formatMatchesDataArray(existingFormat, scalars)) {
        const dataType = scalars.getDataType();
        const canPromoteToFloat32 =
          !treq.preferSizeOverAccuracy &&
          dataType !== VtkDataTypes.UNSIGNED_CHAR &&
          dataType !== VtkDataTypes.UNSIGNED_CHAR_CLAMPED &&
          existingFormat.endsWith('16float') &&
          model.device.hasFeature('float32-filterable');
        const updatedExtentsFitHalfFloat =
          !canPromoteToFloat32 ||
          _updatedExtentsFitHalfFloat(
            scalars,
            imgData.getDimensions(),
            updatedExtents
          );
        if (!updatedExtentsFitHalfFloat) {
          treq.forceFloat32 = true;
        } else {
          treq.existingFormat = existingFormat;
          treq.partialFormat = true;
          treq.fitsHalfFloat =
            canPromoteToFloat32 && previousContentFitsHalfFloat;
        }
      }
    } else {
      treq.existingFormat = _getCachedScalarFormat(
        imgData.getPointData().getScalars(),
        treq.preferSizeOverAccuracy
      );
    }
    // fill out the req time and format based on imageData/image
    _fillRequest(treq);
    // _fillRequest keys the request time on the scalar array mtime alone.
    // Consumers that write scalars in place and only call
    // imageData.modified() must still invalidate the cached texture, so key
    // on the newest of the imageData and scalar array mtimes.
    treq.time = Math.max(treq.time, imgData.getMTime());

    // The mipmap compute pipeline accepts only 2D rgba8unorm storage textures.
    if (
      options.generateMipmaps &&
      treq.depth === 1 &&
      treq.format === 'rgba8unorm'
    ) {
      treq.mipLevel = Math.floor(
        Math.log2(Math.max(treq.width, treq.height, 1))
      );
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      treq.usage =
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING;
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    }

    treq.hash = `${treq.time}:${treq.format}:${treq.mipLevel ?? 0}:${treq.usage}`;

    const cachedTexture = model.device.hasCachedObject(treq.hash);
    let patchTexture = existingTexture;
    if (_canPatchTexture(cachedTexture, treq)) {
      patchTexture = cachedTexture;
    }
    if (updatedExtents?.length && _canPatchTexture(patchTexture, treq)) {
      const writeSucceeded = _writeExtents(patchTexture, treq, updatedExtents);
      if (writeSucceeded && !cachedTexture) {
        // Add a cache key for the modified texture. Other users can share the
        // new content. This does not require a full upload.
        model.device.getCachedObject(treq.hash, () => patchTexture);
      }
      if (writeSucceeded) {
        _cacheScalarFormat(
          treq.dataArray,
          treq.format,
          treq.preferSizeOverAccuracy
        );
        if (treq.fitsHalfFloat) {
          _markHalfFloatFit(treq.dataArray, version);
        }
        return patchTexture;
      }
    }

    if (treq.partialFormat) {
      delete treq.partialFormat;
      delete treq.existingFormat;
      treq.format =
        _formatPrefix(treq.dataArray.getNumberOfComponents()) +
        _scalarFormatSuffix(treq);
      treq.hash = `${treq.time}:${treq.format}:${treq.mipLevel ?? 0}:${treq.usage}`;
    }

    _cacheScalarFormat(
      treq.dataArray,
      treq.format,
      treq.preferSizeOverAccuracy
    );

    if (treq.fitsHalfFloat) {
      _markHalfFloatFit(treq.dataArray, version);
    }

    return model.device.getTextureManager().getTexture(treq);
  };

  publicAPI.getTextureForVTKTexture = (srcTexture, label = undefined) => {
    const treq = { time: srcTexture.getMTime(), label };
    if (srcTexture.getInputData()) {
      treq.imageData = srcTexture.getInputData();
      treq.existingFormat = _getCachedScalarFormat(
        treq.imageData.getPointData().getScalars(),
        false
      );
    } else if (srcTexture.getImage()) {
      treq.image = srcTexture.getImage();
    } else if (srcTexture.getJsImageData()) {
      treq.jsImageData = srcTexture.getJsImageData();
    } else if (srcTexture.getImageBitmap()) {
      treq.imageBitmap = srcTexture.getImageBitmap();
    } else if (srcTexture.getCanvas()) {
      treq.canvas = srcTexture.getCanvas();
    }
    // fill out the req time and format based on imageData/image
    _fillRequest(treq);
    if (treq.imageData) {
      _cacheScalarFormat(treq.dataArray, treq.format, false);
    }
    // _fillRequest derives the cache hash from the scalar array mtime alone,
    // discarding the texture mtime seeded above. A texture rebuild must also
    // be triggered by srcTexture.modified() or imageData.modified() alone, so
    // hash on the newest of the texture, imageData, and scalar array mtimes.
    treq.time = Math.max(treq.time, srcTexture.getMTime());
    if (treq.imageData) {
      treq.time = Math.max(treq.time, treq.imageData.getMTime());
    }
    treq.mipLevel = srcTexture.getMipLevel();
    treq.hash = `${treq.time}:${treq.format}:${treq.mipLevel ?? 0}:${treq.usage}`;
    return model.device.getTextureManager().getTexture(treq);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  handle: null,
  device: null,
  scalarFormats: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  model.scalarFormats = new WeakMap();

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUTextureManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
