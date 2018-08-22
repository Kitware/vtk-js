import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWidgetRepresentation
// ----------------------------------------------------------------------------

function vtkWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetRepresentation');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['actors']);

  // Object specific methods
  vtkWidgetRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
