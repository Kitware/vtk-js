import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function evaluate(normal, origin, x) {
  return (normal[0] * (x[0] - origin[0]))
       + (normal[1] * (x[1] - origin[1]))
       + (normal[2] * (x[2] - origin[2]));
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  evaluate,
};


// ----------------------------------------------------------------------------
// vtkPlane methods
// ----------------------------------------------------------------------------

function vtkPlane(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlane');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['bounds']);
  vtkPlane(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlane');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
