import * as macro from '../../../macro';
import mat4 from 'gl-matrix';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = [
  'parallelProjection',
  'useHorizontalViewAngle',
  'viewAngle',
  'parallelScale',
  'eyeAngle',
  'focalDisk',
  'useOffAxisProjection',
  'eyeSeparation',
  'eyeTransformMatrix',
  'modelTransformMatrix',
  'leftEye',
  'freezeFocalPoint',
  'useScissor',
];

const GET_FIELDS = [
  'thickness',
  'userViewTransform',
  'userTransform',
];

const GET_ARRAY = [
  'directionOfProjection',
  'windowCenter',
  'viewPlaneNormal',
];

const SET_GET_ARRAY_2 = [
  'clippingRange',
];

const SET_GET_ARRAY_3 = [
  'position',
  'focalPoint',
  'viewUp',
  'viewShear',
  'screenBottomLeft',
  'screenBottomRight',
  'screenTopRight',
];


// ----------------------------------------------------------------------------
// Camera methods
// ----------------------------------------------------------------------------

export function camera(publicAPI, model) {
  publicAPI.orthogonalizeViewUp = () => {

  };

  publicAPI.setDistance = d => {

  };

  publicAPI.getDistance = () => {

  };

  publicAPI.dolly = angle => {

  };

  publicAPI.setRoll = roll => {

  };

  publicAPI.getRoll = () => {

  };

  publicAPI.roll = angle => {

  };

  publicAPI.azimuth = angle => {

  };

  publicAPI.yaw = angle => {

  };

  publicAPI.elevation = angle => {

  };

  publicAPI.pitch = angle => {

  };

  publicAPI.zoom = factor => {

  };

  publicAPI.setThickness = thickness => {

  };

  publicAPI.setWindowCenter = (x, y) => {

  };

  publicAPI.setObliqueAngles = (alpha, beta) => {

  };

  publicAPI.applyTransform = transform => {

  };

  publicAPI.setEyePosition = eyePosition => {

  };

  publicAPI.getEyePosition = () => {

  };

  publicAPI.getEyePlaneNormal = () => {

  };

  publicAPI.getModelViewTransformMatrix = () => {
    // returns glmatrix object
  };

  publicAPI.getModelViewTransformObject = () => {
    // return vtkTransform object
  };

  publicAPI.getProjectionTransformMatrix = (aspect, nearz, farz) => {
    // return glmatrix object
  };

  publicAPI.getProjectionTransformObject = (aspect, nearz, farz) => {
    // return vtkTransform object
  };

  publicAPI.getCompositeProjectionTransformMatrix = (aspect, nearz, farz) => {
    // return glmatrix object
  };

  publicAPI.getProjectionTransformMatrix = renderer => {
    // return glmatrix object
  };

  publicAPI.setUserViewTransform = transform => {
    // transform is a vtkHomogeneousTransform
  };

  publicAPI.setUserTransform = transform => {
    // transform is a vtkHomogeneousTransform
  };

  publicAPI.render = renderer => {

  };

  publicAPI.getViewingRaysMTime = () => {

  };

  publicAPI.viewingRaysModified = () => {

  };

  publicAPI.getFrustumPlanes = aspect => {
    // Return array of 24 params (4 params for each of 6 plane equations)
  };

  publicAPI.getOrientation = () => {

  };

  publicAPI.getOrientationWXYZ = () => {

  };

  publicAPI.getCameraLightTransformMatrix = () => {

  };

  publicAPI.updateViewport = () => {

  };

  publicAPI.shallowCopy = sourceCamera => {

  };

  publicAPI.deepCopy = sourceCamera => {

  };

  publicAPI.setScissorRect = rect => {
    // rect is a vtkRect
  };

  publicAPI.getScissorRect = () => {

  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  position: [0, 0, 1],
  focalPoint: [0, 0, 0],
  viewUp: [0, 1, 0],
  directionOfProjection: [0, 0, -1],
  parallelProjection: false,
  useHorizontalViewAngle: false,
  viewAngle: 30,
  parallelScale: 1,
  clippingRange: [0.01, 1000.01],
  thickness: 1000,
  windowCenter: [0, 0],
  viewPlaneNormal: [0, 0, 1],
  viewShear: [0, 0, 1],
  eyeAngle: 2,
  focalDisk: 1,
  useOffAxisProjection: false,
  screenBottomLeft: [-0.5, -0.5, -0.5],
  screenBottomRight: [0.5, -0.5, -0.5],
  screenTopRight: [0.5, 0.5, -0.5],
  eyeSeparation: 0.06,
  /* eslint-disable new-cap */
  eyeTransformMatrix: new mat4(),
  modelTransformMatrix: new mat4(),
  /* eslint-enable new-cap */
  userViewTransform: null,
  userTransform: null,
  leftEye: 1,
  freezeFocalPoint: false,
  useScissor: false,
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, GET_FIELDS);
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.getArray(publicAPI, model, GET_ARRAY);
  macro.setGetArray(publicAPI, model, SET_GET_ARRAY_2, 2);
  macro.setGetArray(publicAPI, model, SET_GET_ARRAY_3, 3);

  // Object methods
  camera(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
