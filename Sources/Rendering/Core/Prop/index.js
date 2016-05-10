import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

function prop(publicAPI, model) {
  publicAPI.getRedrawMTime = () => model.mtime;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  visibility: true,
  pickable: true,
  dragable: true,
  useBounds: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Build VTK API
  macro.setGet(publicAPI, model, Object.keys(DEFAULT_VALUES));

  // Object methods
  prop(publicAPI, model);
}

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkProp');
  extend(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, extend };
