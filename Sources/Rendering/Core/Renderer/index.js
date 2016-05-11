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
  ]);
  macro.getArray(publicAPI, model, ['actors', 'volumes', 'lights']);
  macro.setGetArray(publicAPI, model, ['ambiant'], 3);

  // Object methods
  renderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
