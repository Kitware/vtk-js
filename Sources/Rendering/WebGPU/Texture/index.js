import macro from 'vtk.js/Sources/macro';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';

const { BufferUsage } = vtkWebGPUBufferManager;

// const { ObjectType } = Constants;

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
    model.depth = options.depth;
    model.handle = model.device.getHandle().createTexture({
      size: [options.width, options.height, options.depth],
      format: options.format, // 'rgba8unorm',
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      usage: GPUTextureUsage.SAMPLED | GPUTextureUsage.COPY_DST,
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
    });
  };

  // set the data
  publicAPI.writeImageData = (req) => {
    if (req.dataArray) {
      // create and write the buffer
      const buffRequest = {
        dataArray: req.dataArray.getPointData().getScalars(),
        time: req.dataArray.getPointData().getScalars().getMTime(),
        /* eslint-disable no-undef */
        usage: BufferUsage.Texture,
        /* eslint-enable no-undef */
        format: 'unorm8x4',
      };
      const buff = model.device.getBufferManager().getBuffer(buffRequest);
      model.buffer = buff;

      // get a buffer for the image (todo move into texture manager)
      const cmdEnc = model.device.createCommandEncoder();
      cmdEnc.copyBufferToTexture(
        {
          buffer: model.buffer.getHandle(),
          //        layout: {
          offset: 0,
          bytesPerRow: 4 * model.width,
          rowsPerImage: model.height,
          //        },
        },
        { texture: model.handle },
        [model.width, model.height, model.depth]
      );
      model.device.submitCommandEncoder(cmdEnc);
      model.ready = true;
    } else {
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
      // In Chrome 69 on Windows and Ubuntu, there is a bug that prevents some
      // canvases from working properly with webGL textures.  By getting any
      // image data from the canvas, this works around the bug.  See
      // https://bugs.chromium.org/p/chromium/issues/detail?id=896307
      if (navigator.userAgent.indexOf('Chrome/69') >= 0) {
        ctx.getImageData(0, 0, 1, 1);
      }
      const safeImage = canvas;

      createImageBitmap(safeImage).then((imageBitmap) => {
        model.device
          .getHandle()
          .queue.copyImageBitmapToTexture(
            { imageBitmap },
            { texture: model.handle },
            [model.width, model.height, model.depth]
          );
        model.ready = true;
      });
    }
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

  macro.get(publicAPI, model, ['handle', 'ready']);
  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
