import * as macro from '../../../macro';

// ----------------------------------------------------------------------------
// vtkRenderer methods
// ----------------------------------------------------------------------------

function renderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderer');

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

  publicAPI.isActiveCameraCreated = () => {
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
  interactive: false,
  layer: 1,
  preserveColorBuffer: false,
  preserveDepthBuffer: false,
  useDepthPeeling: false,
  occlusionRatio: 0,
  maximumNumberOfPeels: 4,
  useShadows: false,
  background: [0.2, 0.3, 0.4],
  transparent: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'twoSidedLighting',
    'lightFollowCamera',
    'activeCamera',
    'erase',
    'draw',
    'layer',
    'interactive',
    'renderWindow',
    'preserveColorBuffer',
    'preserveDepthBuffer',
    'useDepthPeeling',
    'occlusionRatio',
    'maximumNumberOfPeels',
    'useShadows',
    'transparent',
  ]);
  macro.getArray(publicAPI, model, ['actors', 'volumes', 'lights']);
  macro.setGetArray(publicAPI, model, ['background'], 3);

  // Object methods
  renderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
