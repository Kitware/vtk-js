import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = [
  'visibility',
  'pickable',
  'dragable',
  'useBounds',
];

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

export function prop(publicAPI, model) {
  publicAPI.getRedrawMTime = () => model.mtime;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  visibility: true,
  pickable: true,
  dragable: true,
  useBounds: true,
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkProp');
  macro.setGet(publicAPI, model, SET_GET_FIELDS);

  // Object methods
  prop(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, DEFAULT_VALUES, prop };
