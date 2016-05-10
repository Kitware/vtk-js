import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

export const ShadingModel = ['VTK_FLAT', 'VTK_GOURAUD', 'VTK_PHONG'];
export const RepresentationModel = ['VTK_POINTS', 'VTK_WIREFRAME', 'VTK_SURFACE'];

const SET_GET_FIELDS = [
  'lighting',
  'interpolation',
  'ambient',
  'diffuse',
  'specular',
  'specularPower',
  'opacity',
  'edgeVisibility',
  'lineWidth',
  'lineStipplePattern',
  'lineStippleRepeatFactor',
  'pointSize',
  'backfaceCulling',
  'frontfaceCulling',
];

const GET_FIELDS = [
  'lineStipplePattern',
];

const FIELD_ARRAY_3 = [
  'ambientColor',
  'specularColor',
  'diffuseColor',
  'edgeColor',
];

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

function property(publicAPI, model) {
  publicAPI.setInterpolationToFlat = () => publicAPI.setInterpolation(0);
  publicAPI.setInterpolationToGouraud = () => publicAPI.setInterpolation(1);
  publicAPI.setInterpolationToPhong = () => publicAPI.setInterpolation(2);

  publicAPI.getInterpolationAsString = () => ShadingModel[model.interpolation];

  publicAPI.setColor = (r, g, b) => {
    if (model.color[0] !== r || model.color[1] !== g || model.color[2] !== b) {
      model.color[0] = r;
      model.color[1] = g;
      model.color[2] = b;
      publicAPI.modified();
    }

    publicAPI.setDiffuseColor(model.color);
    publicAPI.setAmbientColor(model.color);
    publicAPI.setSpecularColor(model.color);
  };

  publicAPI.getColor = () => {
    let norm = 0.0;
    if ((model.ambient + model.diffuse + model.specular) > 0) {
      norm = 1.0 / (model.ambient + model.diffuse + model.specular);
    }

    for (let i = 0; i < 3; i ++) {
      model.color[i] = norm * (
        model.ambient * model.ambientColor[i] +
        model.diffuse * model.diffuseColor[i] +
        model.specular * model.specularColor[i]);
    }

    return [].concat(model.color);
  };

  publicAPI.setLineStipplePattern = (b0, b1) => {
    model.lineStipplePattern[0] = b0;
    model.lineStipplePattern[1] = b1;
    publicAPI.modified();
  };

  // NoOp here
  publicAPI.releaseGraphicsResources = () => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lighting: true,
  interpolation: 0,
  color: [1, 1, 1],
  ambientColor: [1, 1, 1],
  diffuseColor: [1, 1, 1],
  specularColor: [1, 1, 1],
  ambient: 0,
  diffuse: 1,
  specular: 0,
  specularPower: 1,
  opacity: 1,
  edgeVisibility: false,
  edgeColor: [0, 0, 0],
  lineWidth: 1,
  lineStippleRepeatFactor: 1,
  pointSize: 1,
  backfaceCulling: false,
  frontfaceCulling: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Internal object
  model.lineStipplePattern = new Uint8Array(2);
  model.lineStipplePattern[0] = 255;
  model.lineStipplePattern[1] = 255;

  // Build VTK API
  macro.get(publicAPI, model, GET_FIELDS);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.setGetArray(publicAPI, model, FIELD_ARRAY_3, 3);

  // Object methods
  property(publicAPI, model);
}

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, initialValues);
  const publicAPI = {};

  // vtkObject
  macro.obj(publicAPI, model, 'vtkProperty');
  extend(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, extend };
