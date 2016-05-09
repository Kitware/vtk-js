import * as macro from '../../../macro';

function radiansFromDegrees(deg) {
  return deg / 180 * Math.PI;
}

// ----------------------------------------------------------------------------

export const types = ['HeadLight', 'CameraLight', 'SceneLight'];

const SET_GET_FIELDS = [
  'intensity',
  'switch',
  'positional',
  'exponent',
  'coneAngle',
  'transformMatrix',
  'lightType',
  'shadowAttenuation',
];

const SET_GET_ARRAY_3 = [
  'ambientColor',
  'diffuseColor',
  'specularColor',
  'position',
  'focalPoint',
  'attenuationValues',
];

// ----------------------------------------------------------------------------
// Light methods
// ----------------------------------------------------------------------------

export function light(publicAPI, model) {
  publicAPI.getTransformedPosition = () => {
    if (model.transformMatrix) {
      return []; // FIXME !!!!
    }
    return [].concat(model.position);
  };

  publicAPI.getTransformedFocalPoint = () => {
    if (model.transformMatrix) {
      return []; // FIXME !!!!
    }
    return [].concat(model.focalPoint);
  };

  publicAPI.setDirectionAngle = (elevation, azimuth) => {
    const elevationRadians = radiansFromDegrees(elevation);
    const azimuthRadians = radiansFromDegrees(azimuth);

    publicAPI.setPosition(
      Math.cos(elevationRadians) * Math.sin(azimuthRadians),
      Math.sin(elevationRadians),
      Math.cos(elevationRadians) * Math.cos(azimuthRadians));

    publicAPI.setFocalPoint(0, 0, 0);
    publicAPI.setPositional(0);
  };

  publicAPI.setLightTypeToHeadLight = () => {
    publicAPI.setLightType('HeadLight');
  };

  publicAPI.setLightTypeToCameraLight = () => {
    publicAPI.setLightType('CameraLight');
  };

  publicAPI.setLightTypeToSceneLight = () => {
    publicAPI.setTransformMatrix(null);
    publicAPI.setLightType('SceneLight');
  };

  publicAPI.lightTypeIsHeadlight = () => model.lightType === 'HeadLight';

  publicAPI.lightTypeIsSceneLight = () => model.lightType === 'SceneLight';

  publicAPI.lightTypeIsCameraLight = () => model.lightType === 'CameraLight';
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  switch: true,
  intensity: 1,
  ambientColor: [0, 0, 0],
  diffuseColor: [1, 1, 1],
  specularColor: [1, 1, 1],
  position: [0, 0, 1],
  focalPoint: [0, 0, 0],
  positional: false,
  exponent: 1,
  coneAngle: 30,
  attenuationValues: [1, 0, 0],
  transformMatrix: null,
  lightType: 'SceneLight',
  shadowAttenuation: 1,
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.setGetArray(publicAPI, model, SET_GET_ARRAY_3, 3);

  // Object methods
  light(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
