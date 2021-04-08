import * as macro from 'vtk.js/Sources/macro';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

// ----------------------------------------------------------------------------
// vtkWebGPUSwapChain methods
// ----------------------------------------------------------------------------
function vtkWebGPUSwapChain(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSwapChain');

  publicAPI.create = (device, window) => {
    model.device = device;
    model.window = window;
    if (window.getContext()) {
      model.colorFormat = 'bgra8unorm';

      model.handle = window.getContext().configureSwapChain({
        device: device.getHandle(),
        format: model.colorFormat,
        //      usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
      });

      model.depthFormat = 'depth24plus-stencil8';
      model.depthTexture = vtkWebGPUTexture.newInstance();
      model.depthTexture.create(device, {
        width: window.getCanvas().width,
        height: window.getCanvas().height,
        format: model.depthFormat,
        /* eslint-disable no-undef */
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      model.created = true;
    }
  };

  publicAPI.getCurrentTexture = () => {
    const res = vtkWebGPUTexture.newInstance();
    res.assignFromHandle(model.device, model.handle.getCurrentTexture(), {
      width: model.window.getCanvas().width,
      height: model.window.getCanvas().height,
      format: model.swapChainFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return res;
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.created) {
      model.handle = null;
      model.created = false;
      model.depthTexture = null;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  device: null,
  created: false,
  handle: null,
  depthTexture: null,
  renderEncoder: null,
  depthFormat: null,
  colorFormat: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.renderEncoder = vtkWebGPURenderEncoder.newInstance();

  macro.get(publicAPI, model, ['colorFormat', 'depthFormat', 'depthTexture']);
  macro.setGet(publicAPI, model, [
    'created',
    'device',
    'handle',
    'renderEncoder',
  ]);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPUSwapChain(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUSwapChain');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
