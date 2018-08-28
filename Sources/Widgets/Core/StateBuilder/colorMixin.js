import macro from 'vtk.js/Sources/macro';

const DEFAULT_VALUES = {
  color: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['color']);
}

// ----------------------------------------------------------------------------

export default { extend };
