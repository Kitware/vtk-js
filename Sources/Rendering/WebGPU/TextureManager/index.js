import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

const { VtkDataTypes } = vtkDataArray;
const { vtkErrorMacro, vtkWarningMacro } = macro;

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

  // The state has two parts. The first part is valid for one scalar mtime.
  // The second part stays for the life of the data array:
  //  - promotedFormat is the 32 bit float format that an accurate texture of
  //    this array uses after its values stopped fitting half float. All
  //    mappers of the array then use this format and can share one texture.
  //  - liveTextures holds the most recent texture for each format, mip level
  //    and usage. A full upload writes into this texture instead of a new
  //    allocation.
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
        promotedFormat: state?.promotedFormat ?? null,
        liveTextures: state?.liveTextures ?? new Map(),
      };
      model.scalarFormats.set(scalars, state);
    }
    return state;
  }

  function _getPromotedFormat(scalars, preferSizeOverAccuracy) {
    if (preferSizeOverAccuracy) {
      return null;
    }
    const state = _getScalarState(scalars);
    if (
      state.promotedFormat &&
      !_formatMatchesDataArray(state.promotedFormat, scalars)
    ) {
      state.promotedFormat = null;
    }
    return state.promotedFormat;
  }

  function _getCachedScalarFormat(scalars, preferSizeOverAccuracy) {
    const promotedFormat = _getPromotedFormat(scalars, preferSizeOverAccuracy);
    if (promotedFormat) {
      return promotedFormat;
    }
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
    if (!preferSizeOverAccuracy && format.endsWith('32float')) {
      state.promotedFormat = format;
    }
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

    // Image mappers require filterable textures. texture-formats-tier1
    // enables 16 bit normalized formats, but does not make them filterable.
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

      // The RGB to RGBA padding occurs only when the data is uploaded. A
      // request that gets a cached texture does not need it.
      req.padRGBToRGBA = numComp === 3;

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

    _fitImageSizeToDeviceLimits(req);
  }

  // WebGPU has no 3 component formats, thus RGB data uploads as RGBA. Pad
  // req.nativeArray one time, before the first upload that reads it.
  function _prepareNativeArray(req) {
    if (!req.padRGBToRGBA) {
      return;
    }
    const source = req.nativeArray;
    const padded = macro.newTypedArray(
      source.constructor.name,
      (source.length / 3) * 4
    );
    let alpha = 1;
    if (source.BYTES_PER_ELEMENT === 1) {
      alpha = 255;
    }
    for (let i = 0, j = 0; i < source.length; i += 3, j += 4) {
      padded[j] = source[i];
      padded[j + 1] = source[i + 1];
      padded[j + 2] = source[i + 2];
      padded[j + 3] = alpha;
    }
    req.nativeArray = padded;
    req.padRGBToRGBA = false;
  }

  // The image source of a request
  function _getImageSource(req) {
    return (
      req.image || req.imageBitmap || req.canvas || req.jsImageData || null
    );
  }

  // An image source larger than maxTextureDimension2D gets a smaller size,
  // with the same aspect ratio. The request keeps the source, and
  // _scaleImageSource draws it at the smaller size only when the texture is
  // made. Thus a request that gets a cached texture does not draw the image.
  function _fitImageSizeToDeviceLimits(req) {
    const source = _getImageSource(req);
    const maxSize = model.device?.getHandle?.()?.limits?.maxTextureDimension2D;
    if (!source || !maxSize) {
      return;
    }
    const scale = maxSize / Math.max(source.width, source.height);
    if (scale >= 1) {
      return;
    }
    req.width = Math.max(1, Math.floor(source.width * scale));
    req.height = Math.max(1, Math.floor(source.height * scale));
    req.scaleImageSource = true;
  }

  // Draw the image source of the request into a canvas with the size that
  // _fitImageSizeToDeviceLimits gave. The request then uses the canvas in
  // place of the source.
  function _scaleImageSource(req) {
    const source = _getImageSource(req);
    const width = req.width;
    const height = req.height;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (req.jsImageData) {
      const fullCanvas = new OffscreenCanvas(source.width, source.height);
      fullCanvas.getContext('2d').putImageData(req.jsImageData, 0, 0);
      ctx.drawImage(fullCanvas, 0, 0, width, height);
    } else {
      ctx.drawImage(source, 0, 0, width, height);
    }
    vtkWarningMacro(
      `Image size (${source.width}, ${source.height}) is larger than the ` +
        `device limit. The texture is scaled to (${width}, ${height}).`
    );
    req.image = null;
    req.imageBitmap = null;
    req.jsImageData = null;
    req.nativeArray = null;
    req.canvas = canvas;
    req.scaleImageSource = false;
  }

  // Add a mip chain to a 2D request when generateMipmaps supports its
  // format. A 2D request has a depth of 1, or is an array of 2D layers
  // (req.layered2D), such as the six faces of a cube map. Each layer gets
  // its own mip chain. A mipLevel larger than 0 sets the last level, else
  // the chain goes down to 1x1. The mipmap render pass needs
  // RENDER_ATTACHMENT.
  function _requestMipmaps(req, mipLevel = 0) {
    const is2D = req.depth === 1 || req.layered2D;
    if (!is2D || !vtkTexture.canGenerateMipmaps(req.format)) {
      return;
    }
    const maxLevel = Math.floor(Math.log2(Math.max(req.width, req.height, 1)));
    if (mipLevel > 0) {
      req.mipLevel = Math.min(mipLevel, maxLevel);
    } else {
      req.mipLevel = maxLevel;
    }
    /* eslint-disable no-undef */
    /* eslint-disable no-bitwise */
    req.usage |=
      GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING;
    /* eslint-enable no-undef */
    /* eslint-enable no-bitwise */
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

    if (req.scaleImageSource) {
      _scaleImageSource(req);
    }
    _prepareNativeArray(req);

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
    _prepareNativeArray(req);
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

  // A texture from getTextureForImageData with an owner is counted. When the
  // last owner changes to a different texture or releases it, the texture is
  // destroyed after the next submit. A texture that a caller gets without an
  // owner is never destroyed, because its use is not known.
  function _releaseUse(texture) {
    const count = (model.textureUseCounts.get(texture) ?? 1) - 1;
    if (count > 0) {
      model.textureUseCounts.set(texture, count);
      return;
    }
    model.textureUseCounts.delete(texture);
    model.device.afterNextSubmit(() => {
      if (
        model.textureUseCounts.has(texture) ||
        model.unownedTextures.has(texture)
      ) {
        return;
      }
      model.device.removeCachedObject(texture);
      texture.destroy?.();
    });
  }

  function _acquireTexture(owner, texture) {
    const previousTexture = model.textureOwners.get(owner);
    if (previousTexture === texture) {
      return;
    }
    model.textureOwners.set(owner, texture);
    model.textureUseCounts.set(
      texture,
      (model.textureUseCounts.get(texture) ?? 0) + 1
    );
    if (previousTexture) {
      _releaseUse(previousTexture);
    }
  }

  /**
   * Stop the use of the texture that `owner` holds. The texture is destroyed
   * when no other owner holds it.
   */
  publicAPI.releaseTexture = (owner) => {
    const texture = model.textureOwners.get(owner);
    if (!texture) {
      return;
    }
    model.textureOwners.delete(owner);
    _releaseUse(texture);
  };

  function _liveTextureKey(req) {
    return `${req.format}:${req.mipLevel ?? 0}:${req.usage}`;
  }

  // Write the full image into the most recent texture of the data array, if
  // it has the requested size and format. All holders of that texture then
  // see the new content, and no new texture is allocated.
  function _rewriteLiveTexture(req) {
    const state = _getScalarState(req.dataArray);
    const texture = state.liveTextures.get(_liveTextureKey(req))?.deref();
    if (!texture || !_canPatchTexture(texture, req)) {
      return null;
    }
    _prepareNativeArray(req);
    texture.writeImageData(req);
    model.device.getCachedObject(req.hash, () => texture);
    return texture;
  }

  function _setLiveTexture(req, texture) {
    if (texture && typeof texture === 'object') {
      _getScalarState(req.dataArray).liveTextures.set(
        _liveTextureKey(req),
        // eslint-disable-next-line no-undef
        new WeakRef(texture)
      );
    }
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

  function _getTextureForImageData(imgData, options) {
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
      const promotedFormat = _getPromotedFormat(
        scalars,
        treq.preferSizeOverAccuracy
      );
      if (promotedFormat && promotedFormat !== existingFormat) {
        // A different texture of this array already uses float32. Use the
        // same format, so that the request can share that texture.
        treq.forceFloat32 = true;
      } else if (_formatMatchesDataArray(existingFormat, scalars)) {
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

    if (options.generateMipmaps) {
      _requestMipmaps(treq);
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
        _setLiveTexture(treq, patchTexture);
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

    const cachedResult = model.device.hasCachedObject(treq.hash);
    if (cachedResult) {
      return cachedResult;
    }
    const rewrittenTexture = _rewriteLiveTexture(treq);
    if (rewrittenTexture) {
      return rewrittenTexture;
    }
    const newTexture = model.device.getTextureManager().getTexture(treq);
    _setLiveTexture(treq, newTexture);
    return newTexture;
  }

  /**
   * Return a texture for an image. Patch `existingTexture` when
   * `updatedExtents` contains all modified regions.
   *
   * `preferSizeOverAccuracy` permits binary16 storage when the scalar range is
   * not exact in that format.
   * A partial update scans only its extents and keeps the existing format when
   * the scalar type is compatible and all updated values fit.
   *
   * `owner` is a key object for one texture binding of the caller. The
   * manager counts the owners of each texture, and destroys a texture when
   * its last owner changes to a different texture or calls releaseTexture.
   */
  publicAPI.getTextureForImageData = (imgData, options = {}) => {
    const texture = _getTextureForImageData(imgData, options);
    if (texture && typeof texture === 'object') {
      if (options.owner) {
        _acquireTexture(options.owner, texture);
      } else {
        model.unownedTextures.add(texture);
      }
    }
    return texture;
  };

  // A cube map face uses the first row as the top of the face, but vtkImageData
  // keeps the bottom row first. Reverse the rows to get the same orientation
  // as the OpenGL backend.
  function _flipRows(source, height) {
    const flipped = macro.newTypedArray(source.constructor.name, source.length);
    const rowSize = source.length / height;
    for (let y = 0; y < height; y++) {
      const srcOffset = (height - y - 1) * rowSize;
      flipped.set(source.subarray(srcOffset, srcOffset + rowSize), y * rowSize);
    }
    return flipped;
  }

  // Log a cube map error one time for each state of the texture. The render
  // loop asks for the texture on each frame, and the error stays the same
  // until the texture or one of its faces changes.
  function _logCubeMapError(srcTexture, time, message) {
    const key = `${time}:${message}`;
    if (model.cubeMapErrors.get(srcTexture) !== key) {
      model.cubeMapErrors.set(srcTexture, key);
      vtkErrorMacro(message);
    }
  }

  /**
   * Upload the six input ports of srcTexture as the six layers of one 2D
   * texture. A view with the 'cube' dimension samples it as a cube map.
   * Return null when a face is missing, the faces are not square, or the
   * faces do not have the same size and format.
   */
  publicAPI.getCubeTextureForVTKTexture = (srcTexture, label = undefined) => {
    const faces = [];
    let time = srcTexture.getMTime();
    for (let i = 0; i < 6; i++) {
      const imageData = srcTexture.getInputData(i);
      if (!imageData?.getPointData().getScalars()) {
        _logCubeMapError(
          srcTexture,
          time,
          `Cube map face ${i} has no image data with scalars.`
        );
        return null;
      }
      // _fillRequest does not copy the data. The RGB padding and the row
      // flip occur only when the texture is made.
      const face = {
        imageData,
        existingFormat: _getCachedScalarFormat(
          imageData.getPointData().getScalars(),
          false
        ),
      };
      _fillRequest(face);
      _cacheScalarFormat(face.dataArray, face.format, false);
      time = Math.max(time, face.time, imageData.getMTime());
      faces.push(face);
    }

    const first = faces[0];
    for (let i = 1; i < 6; i++) {
      if (
        faces[i].width !== first.width ||
        faces[i].height !== first.height ||
        faces[i].depth !== 1 ||
        faces[i].format !== first.format
      ) {
        _logCubeMapError(
          srcTexture,
          time,
          'Cube map faces must have the same 2D size and scalar format.'
        );
        return null;
      }
    }
    if (first.depth !== 1) {
      _logCubeMapError(srcTexture, time, 'Cube map faces must be 2D images.');
      return null;
    }
    // WebGPU rejects a 'cube' view of a texture with non square layers
    if (first.width !== first.height) {
      _logCubeMapError(srcTexture, time, 'Cube map faces must be square.');
      return null;
    }

    const treq = {
      label,
      time,
      width: first.width,
      height: first.height,
      depth: 6,
      layered2D: true,
      format: first.format,
      usage: first.usage,
      mipLevel: 0,
    };
    // As in the OpenGL backend, an interpolated cube map gets a mip chain
    // for each face
    if (srcTexture.getMipLevel() > 0 || srcTexture.getInterpolate()) {
      _requestMipmaps(treq, srcTexture.getMipLevel());
    }
    treq.hash = `${treq.time}:${treq.format}:${treq.mipLevel}:${treq.usage}:cube`;
    const texture = model.device.getCachedObject(treq.hash, () => {
      const newTex = vtkWebGPUTexture.newInstance({ label });
      newTex.create(model.device, {
        width: treq.width,
        height: treq.height,
        depth: 6,
        dimension: '2d',
        viewDimension: 'cube',
        format: treq.format,
        usage: treq.usage,
        mipLevel: treq.mipLevel,
      });
      for (let i = 0; i < 6; i++) {
        _prepareNativeArray(faces[i]);
        newTex.writeImageData({
          nativeArray: _flipRows(faces[i].nativeArray, treq.height),
          width: treq.width,
          height: treq.height,
          depth: 1,
          originZ: i,
          deferMipmaps: true,
        });
      }
      newTex.generateMipmaps();
      return newTex;
    });
    if (texture && typeof texture === 'object') {
      model.unownedTextures.add(texture);
    }
    return texture;
  };

  /**
   * Return the WebGPU texture for a vtkTexture. When the vtkTexture is a cube
   * map (see vtkTexture.useCubeMap) and `options.allowCubeMap` is true, return
   * a cube map texture. Its createView() gives a view with the 'cube'
   * dimension. Callers that sample only 2D textures leave `allowCubeMap`
   * false and get the 2D texture of input port 0.
   */
  publicAPI.getTextureForVTKTexture = (
    srcTexture,
    label = undefined,
    options = {}
  ) => {
    if (options.allowCubeMap && vtkTexture.useCubeMap(srcTexture)) {
      const cubeTexture = publicAPI.getCubeTextureForVTKTexture(
        srcTexture,
        label
      );
      if (cubeTexture) {
        return cubeTexture;
      }
    }

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
    // As in the OpenGL backend, an interpolated 2D texture gets a full mip
    // chain. A mipLevel set on the vtkTexture also asks for mipmaps.
    if (srcTexture.getMipLevel() > 0 || srcTexture.getInterpolate()) {
      _requestMipmaps(treq, srcTexture.getMipLevel());
    }
    treq.hash = `${treq.time}:${treq.format}:${treq.mipLevel ?? 0}:${treq.usage}`;
    const texture = model.device.getTextureManager().getTexture(treq);
    if (texture && typeof texture === 'object') {
      model.unownedTextures.add(texture);
    }
    return texture;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  handle: null,
  device: null,
  scalarFormats: null,
  textureOwners: null,
  textureUseCounts: null,
  unownedTextures: null,
  cubeMapErrors: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  model.scalarFormats = new WeakMap();
  model.textureOwners = new WeakMap();
  model.textureUseCounts = new Map();
  model.unownedTextures = new WeakSet();
  model.cubeMapErrors = new WeakMap();

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUTextureManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
