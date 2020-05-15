import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  normal: [0, 0, -1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['normal'], 3);
}

// ----------------------------------------------------------------------------

export default { extend };
