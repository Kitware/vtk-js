import * as macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkWebGPUSwapChain methods
// ----------------------------------------------------------------------------
function vtkWebGPUSwapChain(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSwapChain');

  /* eslint-disable no-undef */
  /* eslint-disable no-bitwise */
  publicAPI.create = (device, window) => {
    model.device = device;
    model.window = window;
    if (window.getContext()) {
      model.colorFormat = 'bgra8unorm';

      model.handle = window.getContext().configureSwapChain({
        device: device.getHandle(),
        format: model.colorFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
      });
      model.created = true;
    }
  };

  publicAPI.getCurrentTexture = () => model.handle.getCurrentTexture();

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
  colorFormat: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['colorFormat']);
  macro.setGet(publicAPI, model, ['created', 'device', 'handle']);

  // For more macro methods, see "Sources/macros.js"
  // Object specific methods
  vtkWebGPUSwapChain(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUSwapChain');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
