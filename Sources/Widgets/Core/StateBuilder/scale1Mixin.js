import macro from 'vtk.js/Sources/macros';

const DEFAULT_VALUES = {
  scale1: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['scale1']);
}

// ----------------------------------------------------------------------------

export default { extend };
