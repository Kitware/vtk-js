import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkColorMixin(publicAPI, model) {
  model.classHierarchy.push('vtkColorMixin');
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  color: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.setGet(publicAPI, model, ['color']);

  vtkColorMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
