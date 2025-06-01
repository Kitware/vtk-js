import macro from 'vtk.js/Sources/macros';
import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUTextureView from 'vtk.js/Sources/Rendering/WebGPU/TextureView';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

const { BufferUsage } = vtkWebGPUBufferManager;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWebGPUTexture methods
// ----------------------------------------------------------------------------

function vtkWebGPUTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTexture');

  publicAPI.create = (device, options) => {
    model.device = device;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
    const dimension = model.depth === 1 ? '2d' : '3d';
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
      dimension,
      mipLevelCount: model.mipLevel + 1,
    });
  };

  publicAPI.assignFromHandle = (device, handle, options) => {
    model.device = device;
    model.handle = handle;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
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
    if (req.canvas) {
      model.device.getHandle().queue.copyExternalImageToTexture(
        {
          source: req.canvas,
          flipY: req.flip,
        },
        { texture: model.handle, premultipliedAlpha: true },
        [model.width, model.height, model.depth]
      );

      // Generate mipmaps on GPU if needed
      if (publicAPI.getDimensionality() !== 3 && model.mipLevel > 0) {
        vtkTexture.generateMipmaps(
          model.device.getHandle(),
          model.handle,
          model.mipLevel + 1
        );
      }

      model.ready = true;
      return;
    }

    if (req.jsImageData && !req.nativeArray) {
      req.width = req.jsImageData.width;
      req.height = req.jsImageData.height;
      req.depth = 1;
      req.format = 'rgba8unorm';
      req.flip = true;
      req.nativeArray = req.jsImageData.data;
    }

    const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(model.format);
    let bufferBytesPerRow = model.width * tDetails.stride;

    const alignTextureData = (arr, height, depth) => {
      // bytesPerRow must be a multiple of 256 so we might need to rebuild
      // the data here before passing to the buffer. e.g. if it is unorm8x4 then
      // we need to have width be a multiple of 64
      // Check if the texture is half float
      const halfFloat =
        tDetails.elementSize === 2 && tDetails.sampleType === 'float';

      const bytesPerElement = arr.BYTES_PER_ELEMENT;
      const inWidthInBytes = (arr.length / (height * depth)) * bytesPerElement;

      // No changes needed if not half float and already aligned
      if (!halfFloat && inWidthInBytes % 256 === 0) {
        return [arr, inWidthInBytes];
      }

      // Calculate dimensions for the new buffer
      const inWidth = inWidthInBytes / bytesPerElement;
      const outBytesPerElement = tDetails.elementSize;
      const outWidthInBytes =
        256 * Math.floor((inWidth * outBytesPerElement + 255) / 256);
      const outWidth = outWidthInBytes / outBytesPerElement;

      // Create the output array
      const outArray = macro.newTypedArray(
        halfFloat ? 'Uint16Array' : arr.constructor.name,
        outWidth * height * depth
      );

      // Copy and convert data when needed
      const totalRows = height * depth;
      if (halfFloat) {
        for (let v = 0; v < totalRows; v++) {
          const inOffset = v * inWidth;
          const outOffset = v * outWidth;
          for (let i = 0; i < inWidth; i++) {
            outArray[outOffset + i] = HalfFloat.toHalf(arr[inOffset + i]);
          }
        }
      } else if (outWidth === inWidth) {
        // If the output width is the same as input, just copy
        outArray.set(arr);
      } else {
        for (let v = 0; v < totalRows; v++) {
          outArray.set(
            arr.subarray(v * inWidth, (v + 1) * inWidth),
            v * outWidth
          );
        }
      }

      return [outArray, outWidthInBytes];
    };

    if (req.nativeArray) {
      nativeArray = req.nativeArray;
    }

    if (req.image) {
      const canvas = document.createElement('canvas');
      canvas.width = req.image.width;
      canvas.height = req.image.height;
      const ctx = canvas.getContext('2d');
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      ctx.drawImage(
        req.image,
        0,
        0,
        req.image.width,
        req.image.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const imageData = ctx.getImageData(
        0,
        0,
        req.image.width,
        req.image.height
      );

      nativeArray = imageData.data;
    }

    const cmdEnc = model.device.createCommandEncoder();

    if (publicAPI.getDimensionality() !== 3) {
      // Non-3D
      // First, upload the base mip level (level 0)
      const ret = alignTextureData(nativeArray, model.height, 1);
      bufferBytesPerRow = ret[1];
      const buffRequest = {
        dataArray: req.dataArray ? req.dataArray : null,
        nativeArray: ret[0],
        usage: BufferUsage.Texture,
      };
      const buff = model.device.getBufferManager().getBuffer(buffRequest);
      cmdEnc.copyBufferToTexture(
        {
          buffer: buff.getHandle(),
          offset: 0,
          bytesPerRow: bufferBytesPerRow,
          rowsPerImage: model.height,
        },
        {
          texture: model.handle,
          mipLevel: 0,
        },
        [model.width, model.height, 1]
      );

      // Submit the base level upload
      model.device.submitCommandEncoder(cmdEnc);

      // Generate remaining mip levels on GPU
      if (model.mipLevel > 0) {
        vtkTexture.generateMipmaps(
          model.device.getHandle(),
          model.handle,
          model.mipLevel + 1
        );
      }
      model.ready = true;
    } else {
      // 3D, no mipmaps
      const ret = alignTextureData(nativeArray, model.height, model.depth);
      bufferBytesPerRow = ret[1];
      const buffRequest = {
        dataArray: req.dataArray ? req.dataArray : null,
        usage: BufferUsage.Texture,
      };
      buffRequest.nativeArray = ret[0];
      const buff = model.device.getBufferManager().getBuffer(buffRequest);
      cmdEnc.copyBufferToTexture(
        {
          buffer: buff.getHandle(),
          offset: 0,
          bytesPerRow: bufferBytesPerRow,
          rowsPerImage: model.height,
        },
        { texture: model.handle },
        [model.width, model.height, model.depth]
      );
      model.device.submitCommandEncoder(cmdEnc);
      model.ready = true;
    }
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
        format: model.format,
        usage: model.usage,
        label: model.label,
      });
    }
  };

  publicAPI.createView = (label, options = {}) => {
    // if options is missing values try to add them in
    if (!options.dimension) {
      options.dimension = model.depth === 1 ? '2d' : '3d';
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
