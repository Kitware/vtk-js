import macro from 'vtk.js/Sources/macro';

// const { ObjectType } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWebGPUSampler methods
// ----------------------------------------------------------------------------

function vtkWebGPUSampler(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSampler');

  publicAPI.create = (device, options = {}) => {
    model.device = device;
    model.handle = model.device.getHandle().createSampler({
      magFilter: options.magFilter ? options.magFilter : 'nearest',
      minFilter: options.minFilter ? options.minFilter : 'nearest',
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  handle: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['handle']);
  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUSampler(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
