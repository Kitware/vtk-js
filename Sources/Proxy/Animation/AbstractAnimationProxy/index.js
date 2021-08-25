import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkAbstractAnimationProxy methods
// ----------------------------------------------------------------------------

function vtkAbstractAnimationProxy(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractAnimationProxy');

  // Initialization ------------------------------------------------------------
  publicAPI.setTime = (time) => {};

  publicAPI.getFrames = () => [];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  // Object specific methods
  vtkAbstractAnimationProxy(publicAPI, model);

  // Proxy handling
  macro.proxy(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkAbstractAnimationProxy'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
