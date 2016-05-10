import * as macro from '../../../macro';

// ----------------------------------------------------------------------------

const SET_GET_FIELDS = [
  'cursor',
  'cursorVisibility',
  'swapBuffers',
  'multiSamples',
  'interactor',
  'numberOfLayers',
  'width',
  'height',
  'useOffScreen',
];

const GET_ONLY = [
  'neverRendered',
  'canvas',
];

// ----------------------------------------------------------------------------
// RenderWindow methods
// ----------------------------------------------------------------------------

export function renderWindow(publicAPI, model) {
  // Auto update style
  function updateWindow() {
    // Canvas size
    model.canvas.setAttribute('width', model.width);
    model.canvas.setAttribute('height', model.height);

    // Offscreen ?
    model.canvas.style.display = model.useOffScreen ? 'none' : 'block';

    // Cursor type
    if (model.el) {
      model.el.style.cursor = model.cursorVisibility ? model.cursor : 'none';
    }
  }
  publicAPI.onModified(updateWindow);

  // Add renderer
  publicAPI.addRenderer = renderer => {
    model.renderers.push(renderer);
    publicAPI.modified();
  };

  // Remove renderer
  publicAPI.removeRenderer = renderer => {
    model.renderers = model.renderers.filter(r => r !== renderer);
    publicAPI.modified();
  };

  publicAPI.hasRenderer = () => !!model.renderers.length;

  publicAPI.render = () => {
    // FIXME
    model.renderers.forEach(renderer => renderer.render());
  };

  // Initialize the rendering process.
  publicAPI.start = () => {
    // FIXME
  };

  // Finalize the rendering process.
  publicAPI.finalize = () => {
    // FIXME
  };

  // A termination method performed at the end of the rendering process
  // to do things like swapping buffers (if necessary) or similar actions.
  publicAPI.frame = () => {
    // FIXME
  };

  publicAPI.setContainer = el => {
    if (model.el && model.el !== el) {
      // Remove canvas from previous container
      if (model.canvas.parentNode === model.el) {
        model.el.removeChild(model.canvas);
      } else {
        console.log('Error: canvas parent node does not match container');
      }
    }

    if (model.el !== el) {
      model.el = el;
      model.el.appendChild(model.canvas);

      // Trigger modified()
      publicAPI.modified();
    }
  };

  publicAPI.get2DContext = () => model.canvas.getContext('2d');

  publicAPI.get3DContext = (options = { preserveDrawingBuffer: true, premultipliedAlpha: false }) =>
    model.canvas.getContext('webgl', options) || model.canvas.getContext('experimental-webgl', options);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  renderers: [],
  cursor: 'pointer',
  cursorVisibility: true,
  swapBuffers: false,
  multiSamples: 0,
  interactor: null,
  neverRendered: true,
  numberOfLayers: 1,
  width: 400,
  height: 400,
  canvas: document.createElement('canvas'),
  useOffScreen: false,
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkRenderWindow');
  macro.setGet(publicAPI, model, SET_GET_FIELDS);
  macro.get(publicAPI, model, GET_ONLY);
  macro.getArray(publicAPI, model, ['renderers']);
  macro.event(publicAPI, model, 'completion');

  // Object methods
  renderWindow(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, DEFAULT_VALUES, renderWindow };
