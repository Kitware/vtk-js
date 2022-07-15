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

    const fixAll = (arr, height, depth) => {
      // bytesPerRow must be a multiple of 256 so we might need to rebuild
      // the data here before passing to the buffer. e.g. if it is unorm8x4 then
      // we need to have width be a multiple of 64
      const inWidthInBytes =
        (arr.length / (height * depth)) * arr.BYTES_PER_ELEMENT;

      // is this a half float texture?
      const halfFloat =
        tDetails.elementSize === 2 && tDetails.sampleType === 'float';

      // if we need to copy the data
      if (halfFloat || inWidthInBytes % 256) {
        const inArray = arr;
        const inWidth = inWidthInBytes / inArray.BYTES_PER_ELEMENT;

        const outBytesPerElement = tDetails.elementSize;
        const outWidthInBytes =
          256 * Math.floor((inWidth * outBytesPerElement + 255) / 256);
        const outWidth = outWidthInBytes / outBytesPerElement;

        const outArray = macro.newTypedArray(
          halfFloat ? 'Uint16Array' : inArray.constructor.name,
          outWidth * height * depth
        );

        for (let v = 0; v < height * depth; v++) {
          if (halfFloat) {
            for (let i = 0; i < inWidth; i++) {
              outArray[v * outWidth + i] = HalfFloat.toHalf(
                inArray[v * inWidth + i]
              );
            }
          } else {
            outArray.set(
              inArray.subarray(v * inWidth, (v + 1) * inWidth),
              v * outWidth
            );
          }
        }
        return [outArray, outWidthInBytes];
      }
      return [arr, inWidthInBytes];
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
      // Non-3D, supports mipmaps
      const mips = vtkTexture.generateMipmaps(
        nativeArray,
        model.width,
        model.height,
        model.mipLevel
      );
      let currentWidth = model.width;
      let currentHeight = model.height;
      for (let m = 0; m <= model.mipLevel; m++) {
        const fix = fixAll(mips[m], currentHeight, 1);
        bufferBytesPerRow = fix[1];
        const buffRequest = {
          dataArray: req.dataArray ? req.dataArray : null,
          nativeArray: fix[0],
          /* eslint-disable no-undef */
          usage: BufferUsage.Texture,
          /* eslint-enable no-undef */
        };
        const buff = model.device.getBufferManager().getBuffer(buffRequest);
        cmdEnc.copyBufferToTexture(
          {
            buffer: buff.getHandle(),
            offset: 0,
            bytesPerRow: bufferBytesPerRow,
            rowsPerImage: currentHeight,
          },
          {
            texture: model.handle,
            mipLevel: m,
          },
          [currentWidth, currentHeight, 1]
        );
        currentWidth /= 2;
        currentHeight /= 2;
      }
      model.device.submitCommandEncoder(cmdEnc);
      model.ready = true;
    } else {
      // 3D, no mipmaps
      const fix = fixAll(nativeArray, model.height, model.depth);
      bufferBytesPerRow = fix[1];
      const buffRequest = {
        dataArray: req.dataArray ? req.dataArray : null,
        /* eslint-disable no-undef */
        usage: BufferUsage.Texture,
        /* eslint-enable no-undef */
      };
      buffRequest.nativeArray = fix[0];
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
