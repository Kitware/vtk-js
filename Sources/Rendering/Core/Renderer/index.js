import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = [
  'twoSidedLighting', 'lightFollowCamera', 'activeCamera',
  'erase', 'draw', 'layer', 'interactive',
  'renderWindow', 'preserveColorBuffer', 'preserveDepthBuffer',
  'useDepthPeeling', 'occlusionRatio', 'maximumNumberOfPeels',
  'useShadows',
];
const GET_ONLY = [];
const GET_ARRAY_ONLY = ['actors', 'volumes', 'lights'];
const SET_GET_ARRAY_3 = ['ambiant'];

// ----------------------------------------------------------------------------
// Renderer methods
// ----------------------------------------------------------------------------

function renderer(publicAPI, model) {
  publicAPI.addActor = actor => {
    model.actors = [].concat(model.actors, actor);
    publicAPI.modified();
  };

  publicAPI.removeActor = actor => {
    model.actors = model.actors.filter(a => a !== actor);
    publicAPI.modified();
  };

  publicAPI.addVolume = volume => {
    model.volumes = [].concat(model.volumes, volume);
    publicAPI.modified();
  };

  publicAPI.removeVolume = volume => {
    model.volumes = model.volumes.filter(v => v !== volume);
    publicAPI.modified();
  };

  publicAPI.addLight = light => {
    model.lights = [].concat(model.lights, light);
    publicAPI.modified();
  };

  publicAPI.removeLight = light => {
    model.lights = model.lights.filter(l => l !== light);
    publicAPI.modified();
  };

  publicAPI.removeAllLights = () => { model.lights = []; };

  publicAPI.setRenderWindow = renderWindow => {
    model.renderWindow = renderWindow;
    renderWindow.addRenderer(publicAPI);
  };

  // FIXME resetCamera... resetCameraClippingRange...
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
  volumes: [],
  light: [],
  twoSidedLighting: true,
  lightFollowCamera: true,
  renderWindow: null,
  activeCamera: null, // FIXME create one by default
  erase: true,
  draw: true,
  ambiant: [1, 1, 1],
  interactive: false,
  layer: 1,
  preserveColorBuffer: false,
  preserveDepthBuffer: false,
  useDepthPeeling: false,
  occlusionRatio: 0,
  maximumNumberOfPeels: 4,
  useShadows: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Build VTK API
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.get(publicAPI, model, GET_ONLY);
  macro.getArray(publicAPI, model, GET_ARRAY_ONLY);
  macro.setGetArray(publicAPI, model, SET_GET_ARRAY_3, 3);

  // Object methods
  renderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkRenderer');
  extend(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, extend };
