import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

export const ShadingModel = ['VTK_FLAT', 'VTK_GOURAUD', 'VTK_PHONG'];
export const RepresentationModel = ['VTK_POINTS', 'VTK_WIREFRAME', 'VTK_SURFACE'];

const SET_GET_FIELDS = [
  'lighting',
  'interpolation',
];

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

export function property(publicAPI, model) {
  publicAPI.setInterpolationToFlat = () => publicAPI.setInterpolation(0);
  publicAPI.setInterpolationToGouraud = () => publicAPI.setInterpolation(1);
  publicAPI.setInterpolationToPhong = () => publicAPI.setInterpolation(2);

  publicAPI.getInterpolationAsString = () => ShadingModel[model.interpolation];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lighting: true,
  interpolation: 0,
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);

  // Object methods
  property(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
