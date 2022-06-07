import macro from 'vtk.js/Sources/macros';
import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUTextureView from 'vtk.js/Sources/Rendering/WebGPU/TextureView';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

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

  // set the data
  publicAPI.writeImageData = (req) => {
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
    if (req.nativeArray) {
      // create and write the buffer
      const buffRequest = {
        /* eslint-disable no-undef */
        usage: BufferUsage.Texture,
        /* eslint-enable no-undef */
      };

      if (req.dataArray) {
        buffRequest.dataArray = req.dataArray;
      }
      buffRequest.nativeArray = req.nativeArray;

      // bytesPerRow must be a multiple of 256 so we might need to rebuild
      // the data here before passing to the buffer. e.g. if it is unorm8x4 then
      // we need to have width be a multiple of 64
      const inWidthInBytes =
        (req.nativeArray.length / (model.height * model.depth)) *
        req.nativeArray.BYTES_PER_ELEMENT;

      // is this a half float texture?
      const halfFloat =
        tDetails.elementSize === 2 && tDetails.sampleType === 'float';

      // if we need to copy the data
      if (halfFloat || inWidthInBytes % 256) {
        const inArray = req.nativeArray;
        const inWidth = inWidthInBytes / inArray.BYTES_PER_ELEMENT;

        const outBytesPerElement = tDetails.elementSize;
        const outWidthInBytes =
          256 * Math.floor((inWidth * outBytesPerElement + 255) / 256);
        const outWidth = outWidthInBytes / outBytesPerElement;

        const outArray = macro.newTypedArray(
          halfFloat ? 'Uint16Array' : inArray.constructor.name,
          outWidth * model.height * model.depth
        );

        for (let v = 0; v < model.height * model.depth; v++) {
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
        buffRequest.nativeArray = outArray;
        bufferBytesPerRow = outWidthInBytes;
      }
      const buff = model.device.getBufferManager().getBuffer(buffRequest);
      model.buffer = buff;
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

      // create and write the buffer
      const buffRequest = {
        nativeArray: imageData.data,
        /* eslint-disable no-undef */
        usage: BufferUsage.Texture,
        /* eslint-enable no-undef */
        format: 'unorm8x4',
      };
      const buff = model.device.getBufferManager().getBuffer(buffRequest);
      model.buffer = buff;
    }

    // get a buffer for the image
    const cmdEnc = model.device.createCommandEncoder();
    cmdEnc.copyBufferToTexture(
      {
        buffer: model.buffer.getHandle(),
        offset: 0,
        bytesPerRow: bufferBytesPerRow,
        rowsPerImage: model.height,
      },
      { texture: model.handle },
      [model.width, model.height, model.depth]
    );
    model.device.submitCommandEncoder(cmdEnc);
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
