import macro from 'vtk.js/Sources/macro';

const DEFAULT_VALUES = {
  visible: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['visible']);
  publicAPI.isVisible = publicAPI.getVisible;
}

// ----------------------------------------------------------------------------

export default { extend };
