import macro from 'vtk.js/Sources/macro';

const DEFAULT_VALUES = {
  bounds: [-1, 1, -1, 1, -1, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['bounds'], 6);
  model.bounds = model.bounds.slice();
}

// ----------------------------------------------------------------------------

export default { extend };
