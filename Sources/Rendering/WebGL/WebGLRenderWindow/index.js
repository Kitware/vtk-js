import * as macro from '../../../macro';
import ViewNode from '../../SceneGraph/ViewNode';

const GET_FIELDS = [
  'shaderCache',
];

// ----------------------------------------------------------------------------

export function webGLRenderWindow(publicAPI, model) {
  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderble.getRenderers());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.initialize = () => {
    model.context = model.get3DContext();
  };

  publicAPI.makeCurrent = () => {
    model.context.makeCurrent();
  };

  publicAPI.swap = () => {
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      // make current
    } else {
      // else
    }
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

const DEFAULT_VALUES = {
  shaderCache: null,
  initialized: false,
  context: null,
  canvas: document.createElement('canvas'),
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, ViewNode.DEFAULT_VALUES, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, GET_FIELDS);

  // Object methods
  ViewNode.viewNode(publicAPI, model);
  webGLRenderWindow(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
