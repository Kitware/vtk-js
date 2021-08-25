import macro from 'vtk.js/Sources/macros';

const DEFAULT_VALUES = {
  scale3: [1, 1, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['scale3'], 3);
}

// ----------------------------------------------------------------------------

export default { extend };
