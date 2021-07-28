import macro from 'vtk.js/Sources/macros';

const DEFAULT_VALUES = {
  text: 'DefaultText',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['text']);
}

// ----------------------------------------------------------------------------

export default { extend };
