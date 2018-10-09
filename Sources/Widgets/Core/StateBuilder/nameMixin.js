import macro from 'vtk.js/Sources/macro';

const DEFAULT_VALUES = {
  name: '',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['name']);
}

// ----------------------------------------------------------------------------

export default { extend };
