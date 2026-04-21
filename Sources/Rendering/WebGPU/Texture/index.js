import macro from 'vtk.js/Sources/macros';
import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';
import vtkWebGPUTextureView from 'vtk.js/Sources/Rendering/WebGPU/TextureView';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWebGPUTexture methods
// ----------------------------------------------------------------------------

function vtkWebGPUTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTexture');

  const getUploadArrayType = (tDetails, fallbackType) => {
    if (tDetails.elementSize === 2 && tDetails.sampleType === 'float') {
      return 'Uint16Array';
    }

    if (tDetails.sampleType === 'sint') {
      if (tDetails.elementSize === 1) return 'Int8Array';
      if (tDetails.elementSize === 2) return 'Int16Array';
      if (tDetails.elementSize === 4) return 'Int32Array';
    } else if (tDetails.sampleType === 'unfilterable-float') {
      if (tDetails.elementSize === 4) return 'Float32Array';
    } else {
      if (tDetails.elementSize === 1) return 'Uint8Array';
      if (tDetails.elementSize === 2) return 'Uint16Array';
      if (tDetails.elementSize === 4) return 'Uint32Array';
    }

    return fallbackType;
  };

  const prepareTextureUploadData = (arr, width, height, depth) => {
    const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    const expectedRowElements = width * tDetails.numComponents;
    const expectedElementCount = expectedRowElements * height * depth;
    const halfFloat =
      tDetails.elementSize === 2 && tDetails.sampleType === 'float';

    if (!arr?.length && expectedElementCount > 0) {
      vtkErrorMacro('Texture upload failed: missing nativeArray data.');
      return null;
    }

    if (arr.length < expectedElementCount) {
      vtkErrorMacro(
        `Texture upload failed: expected ${expectedElementCount} values but received ${arr.length}.`
      );
      return null;
    }

    const inputArray =
      arr.length > expectedElementCount
        ? arr.subarray(0, expectedElementCount)
        : arr;

    const sourceBytesPerElement =
      inputArray.BYTES_PER_ELEMENT || tDetails.elementSize;
    const expectedBytesPerRow = width * tDetails.stride;
    const alignedBytesPerRow =
      256 * Math.floor((expectedBytesPerRow + 255) / 256);
    const outputArrayType = getUploadArrayType(
      tDetails,
      inputArray.constructor.name
    );
    const outputBytesPerElement = halfFloat
      ? 2
      : macro.newTypedArray(outputArrayType, 0).BYTES_PER_ELEMENT;
    const alignedRowElements = alignedBytesPerRow / outputBytesPerElement;
    const inputRowBytes = expectedRowElements * sourceBytesPerElement;
    const requiresRepack =
      halfFloat ||
      inputArray.constructor.name !== outputArrayType ||
      inputRowBytes !== alignedBytesPerRow;

    // No changes needed if not half float and already aligned
    if (!requiresRepack) {
      return {
        data: inputArray,
        bytesPerRow: alignedBytesPerRow,
      };
    }

    // Create the output array
    const totalRows = height * depth;
    const outArray = macro.newTypedArray(
      outputArrayType,
      alignedRowElements * totalRows
    );

    // Copy and convert data when needed
    if (halfFloat) {
      for (let row = 0; row < totalRows; row++) {
        const inOffset = row * expectedRowElements;
        const outOffset = row * alignedRowElements;
        for (let i = 0; i < expectedRowElements; i++) {
          outArray[outOffset + i] = HalfFloat.toHalf(inputArray[inOffset + i]);
        }
      }
    } else if (alignedRowElements === expectedRowElements) {
      // If the output width is the same as input, just copy
      outArray.set(inputArray);
    } else {
      for (let row = 0; row < totalRows; row++) {
        outArray.set(
          inputArray.subarray(
            row * expectedRowElements,
            (row + 1) * expectedRowElements
          ),
          row * alignedRowElements
        );
      }
    }

    return {
      data: outArray,
      bytesPerRow: alignedBytesPerRow,
    };
  };

  const validateTextureWriteBounds = (x, y, z, width, height, depth) => {
    if (x < 0 || y < 0 || z < 0 || width <= 0 || height <= 0 || depth <= 0) {
      vtkErrorMacro(
        `Texture upload failed: invalid write region ` +
          `origin=(${x}, ${y}, ${z}) ` +
          `size=(${width}, ${height}, ${depth}).`
      );
      return false;
    }

    if (
      x + width > model.width ||
      y + height > model.height ||
      z + depth > model.depth
    ) {
      vtkErrorMacro(
        `Texture upload failed: write region ` +
          `origin=(${x}, ${y}, ${z}) ` +
          `size=(${width}, ${height}, ${depth}) ` +
          `exceeds texture extent=(${model.width}, ` +
          `${model.height}, ${model.depth}).`
      );
      return false;
    }

    return true;
  };

  publicAPI.create = (device, options) => {
    model.device = device;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
    if (options.dimension) {
      model.dimension = options.dimension;
    } else {
      model.dimension = model.depth === 1 ? '2d' : '3d';
    }
    model.format = options.format ? options.format : 'rgba8unorm';
    model.mipLevel = options.mipLevel ? options.mipLevel : 0;
    /* eslint-disable no-undef */
    /* eslint-disable no-bitwise */
    model.usage = options.usage
      ? options.usage
      : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    /* eslint-enable no-undef */
    /* eslint-enable no-bitwise */
    model.handle = model.device.getHandle().createTexture({
      size: [model.width, model.height, model.depth],
      format: model.format, // 'rgba8unorm',
      usage: model.usage,
      label: model.label,
      dimension: model.dimension,
      mipLevelCount: model.mipLevel + 1,
    });
  };

  publicAPI.assignFromHandle = (device, handle, options) => {
    model.device = device;
    model.handle = handle;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
    if (options.dimension) {
      model.dimension = options.dimension;
    } else {
      model.dimension = model.depth === 1 ? '2d' : '3d';
    }
    model.format = options.format ? options.format : 'rgba8unorm';
    /* eslint-disable no-undef */
    /* eslint-disable no-bitwise */
    model.usage = options.usage
      ? options.usage
      : GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
    /* eslint-enable no-undef */
    /* eslint-enable no-bitwise */
  };

  publicAPI.writeImageData = (req) => {
    let nativeArray = [];
    const _copyImageToTexture = (source) => {
      const originZ = req.originZ ?? 0;
      const depth = req.depth ?? 1;
      model.device.getHandle().queue.copyExternalImageToTexture(
        {
          source,
          flipY: req.flip,
        },
        {
          texture: model.handle,
          premultipliedAlpha: true,
          mipLevel: 0,
          origin: { x: 0, y: 0, z: originZ },
        },
        [source.width, source.height, depth]
      );

      // Generate mipmaps on GPU if needed
      if (model.dimension === '2d' && depth === 1 && model.mipLevel > 0) {
        vtkTexture.generateMipmaps(
          model.device.getHandle(),
          model.handle,
          model.mipLevel + 1
        );
      }

      model.ready = true;
    };

    if (req.canvas) {
      _copyImageToTexture(req.canvas);
      return;
    }

    if (req.imageBitmap) {
      req.width = req.imageBitmap.width;
      req.height = req.imageBitmap.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      _copyImageToTexture(req.imageBitmap);
      return;
    }

    if (req.jsImageData) {
      req.width = req.jsImageData.width;
      req.height = req.jsImageData.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      _copyImageToTexture(req.jsImageData);
      return;
    }

    if (req.image) {
      req.width = req.image.width;
      req.height = req.image.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      _copyImageToTexture(req.image);
      return;
    }

    if (req.nativeArray) {
      nativeArray = req.nativeArray;
    }

    const width = req.width ?? model.width;
    const height = req.height ?? model.height;
    const depth = req.depth ?? 1;
    const preparedData = prepareTextureUploadData(
      nativeArray,
      width,
      height,
      depth
    );
    if (!preparedData) {
      return;
    }
    const data = preparedData.data;

    model.device.getHandle().queue.writeTexture(
      {
        texture: model.handle,
        mipLevel: 0,
        origin: { x: 0, y: 0, z: req.originZ ?? 0 },
      },
      data,
      {
        offset: 0,
        bytesPerRow: preparedData.bytesPerRow,
        rowsPerImage: height,
      },
      {
        width,
        height,
        depthOrArrayLayers: depth,
      }
    );

    if (model.dimension === '2d' && depth === 1 && model.mipLevel > 0) {
      vtkTexture.generateMipmaps(
        model.device.getHandle(),
        model.handle,
        model.mipLevel + 1
      );
    }
    model.ready = true;
  };

  publicAPI.writeSubImageData = (req) => {
    const x = req.x ?? 0;
    const y = req.y ?? 0;
    const z = req.z ?? 0;
    const width = req.width ?? model.width - x;
    const height = req.height ?? model.height - y;
    const depth = req.depth ?? model.depth - z;
    const nativeArray = req.nativeArray || [];
    if (!validateTextureWriteBounds(x, y, z, width, height, depth)) {
      return;
    }
    const preparedData = prepareTextureUploadData(
      nativeArray,
      width,
      height,
      depth
    );
    if (!preparedData) {
      return;
    }

    model.device.getHandle().queue.writeTexture(
      {
        texture: model.handle,
        mipLevel: 0,
        origin: {
          x,
          y,
          z,
        },
      },
      preparedData.data,
      {
        offset: 0,
        bytesPerRow: preparedData.bytesPerRow,
        rowsPerImage: height,
      },
      {
        width,
        height,
        depthOrArrayLayers: depth,
      }
    );

    if (publicAPI.getDimensionality() !== 3 && model.mipLevel > 0) {
      vtkTexture.generateMipmaps(
        model.device.getHandle(),
        model.handle,
        model.mipLevel + 1
      );
    }

    model.ready = true;
  };

  // when data is pulled out of this texture what scale must be applied to
  // get back to the original source data. For formats such as r8unorm we
  // have to multiply by 255.0, for formats such as r16float it is 1.0
  publicAPI.getScale = () => {
    const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    const halfFloat =
      tDetails.elementSize === 2 && tDetails.sampleType === 'float';
    return halfFloat ? 1.0 : 255.0;
  };

  publicAPI.getNumberOfComponents = () => {
    const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    return tDetails.numComponents;
  };

  publicAPI.getDimensionality = () => {
    let dims = 0;
    if (model.width > 1) dims++;
    if (model.height > 1) dims++;
    if (model.depth > 1) dims++;
    return dims;
  };

  publicAPI.resizeToMatch = (tex) => {
    if (
      tex.getWidth() !== model.width ||
      tex.getHeight() !== model.height ||
      tex.getDepth() !== model.depth
    ) {
      model.width = tex.getWidth();
      model.height = tex.getHeight();
      model.depth = tex.getDepth();
      model.handle = model.device.getHandle().createTexture({
        size: [model.width, model.height, model.depth],
        dimension: model.dimension,
        format: model.format,
        usage: model.usage,
        label: model.label,
      });
    }
  };

  publicAPI.resize = (width, height, depth = 1) => {
    if (
      width !== model.width ||
      height !== model.height ||
      depth !== model.depth
    ) {
      model.width = width;
      model.height = height;
      model.depth = depth;
      model.handle = model.device.getHandle().createTexture({
        size: [model.width, model.height, model.depth],
        dimension: model.dimension,
        format: model.format,
        usage: model.usage,
        label: model.label,
      });
    }
  };

  publicAPI.createView = (label, options = {}) => {
    // if options is missing values try to add them in
    if (!options.dimension) {
      if (model.dimension === '3d') {
        options.dimension = '3d';
      } else if (model.depth === 1) {
        options.dimension = '2d';
      } else {
        options.dimension = '2d-array';
      }
    }
    const view = vtkWebGPUTextureView.newInstance({ label });
    view.create(publicAPI, options);
    return view;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  dimension: '2d',
  handle: null,
  buffer: null,
  ready: false,
  label: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, [
    'dimension',
    'handle',
    'ready',
    'width',
    'height',
    'depth',
    'format',
    'usage',
  ]);
  macro.setGet(publicAPI, model, ['device', 'label']);

  vtkWebGPUTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
