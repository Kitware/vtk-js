import macro from 'vtk.js/Sources/macros';
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
    model.format = options.format ? options.format : 'rgbaunorm';
    /* eslint-disable no-undef */
    /* eslint-disable no-bitwise */
    model.usage = options.usage
      ? options.usage
      : GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST;
    /* eslint-enable no-undef */
    /* eslint-enable no-bitwise */
    model.handle = model.device.getHandle().createTexture({
      size: [model.width, model.height, model.depth],
      format: model.format, // 'rgba8unorm',
      usage: model.usage,
      dimension,
    });
  };

  publicAPI.assignFromHandle = (device, handle, options) => {
    model.device = device;
    model.handle = handle;
    model.width = options.width;
    model.height = options.height;
    model.depth = options.depth ? options.depth : 1;
    model.format = options.format ? options.format : 'rgbaunorm';
    /* eslint-disable no-undef */
    /* eslint-disable no-bitwise */
    model.usage = options.usage
      ? options.usage
      : GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST;
    /* eslint-enable no-undef */
    /* eslint-enable no-bitwise */
  };

  // set the data
  publicAPI.writeImageData = (req) => {
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
        buffRequest.time = req.dataArray.getMTime();
      }
      buffRequest.nativeArray = req.nativeArray;

      // bytesPerRow must be a multiple of 256 so we might need to rebuild
      // the data here before passing to the buffer. e.g. if it is unorm8x4 then
      // we need to have width be a multiple of 64
      const currWidthInBytes = model.width * tDetails.stride;
      if (currWidthInBytes % 256) {
        const oArray = req.dataArray.getData();
        const bufferWidthInBytes =
          256 * Math.floor((currWidthInBytes + 255) / 256);
        const bufferWidth = bufferWidthInBytes / oArray.BYTES_PER_ELEMENT;
        const oWidth = currWidthInBytes / oArray.BYTES_PER_ELEMENT;

        const nArray = macro.newTypedArray(
          oArray.name,
          bufferWidth * model.height * model.depth
        );

        for (let v = 0; v < model.height * model.depth; v++) {
          nArray.set(
            oArray.subarray(v * oWidth, (v + 1) * oWidth),
            v * bufferWidth
          );
        }
        buffRequest.nativeArray = nArray;
        bufferBytesPerRow = bufferWidthInBytes;
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
        time: 0,
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
      });
    }
  };

  publicAPI.createView = (options = {}) => {
    // if options is missing values try to add them in
    if (!options.dimension) {
      options.dimension = model.depth === 1 ? '2d' : '3d';
    }
    const view = vtkWebGPUTextureView.newInstance();
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
  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
