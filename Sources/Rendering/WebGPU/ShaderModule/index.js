import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWebGPUShaderModule methods
// ----------------------------------------------------------------------------

function vtkWebGPUShaderModule(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUShaderModule');

  publicAPI.initialize = (device, shaderDesc) => {
    model.device = device;
    model.handle = model.device.getHandle().createShaderModule({
      code: shaderDesc.getCode(),
    });
  };

  // publicAPI.setLastCameraMTime = (mtime) => {
  //   model.lastCameraMTime = mtime;
  // };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  handle: null,
};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['lastCameraMTime']);
  macro.setGet(publicAPI, model, ['device', 'handle']);

  // Object methods
  vtkWebGPUShaderModule(publicAPI, model);
}

// ----------------------------------------------------------------------------

const newInstance = macro.newInstance(extend, 'vtkWebGPUShaderModule');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
