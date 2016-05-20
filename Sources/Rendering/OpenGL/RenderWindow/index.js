import * as macro from '../../../macro';
import vtkOpenGLViewNodeFactory from '../ViewNodeFactory';
import vtkShaderCache from '../ShaderCache';
import vtkViewNode from '../../SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLRenderWindow methods
// ----------------------------------------------------------------------------

export function vtkOpenGLRenderWindow(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLRenderWindow');

  // Auto update style
  function updateWindow() {
    // Canvas size
    if (model.renderable) {
      model.canvas.setAttribute('width', model.size[0]);
      model.canvas.setAttribute('height', model.size[1]);
    }
    // Offscreen ?
    model.canvas.style.display = model.useOffScreen ? 'none' : 'block';

    // Cursor type
    if (model.el) {
      model.el.style.cursor = model.cursorVisibility ? model.cursor : 'none';
    }
  }
  publicAPI.onModified(updateWindow);

  // Builds myself.
  publicAPI.build = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getRenderers());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.initialize = () => {
    if (!model.initialized) {
      model.context = publicAPI.get3DContext();
      model.shaderCache.setContext(model.context);
      model.initialized = true;
    }
  };

  publicAPI.makeCurrent = () => {
    model.context.makeCurrent();
  };

  publicAPI.frame = () => {
  };

  // Renders myself
  publicAPI.render = (prepass) => {
    if (prepass) {
      publicAPI.initialize();
      model.children.forEach(child => {
        child.setContext(model.context);
      });
    } else {
      publicAPI.frame();
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

  publicAPI.isInViewport = (x, y, viewport) => {
    const vCoords = viewport.getViewport();
    const size = model.size;
    if ((vCoords[0] * size[0] <= x) &&
        (vCoords[2] * size[0] >= x) &&
        (vCoords[1] * size[1] <= y) &&
        (vCoords[3] * size[1] >= y)) {
      return true;
    }
    return false;
  };

  publicAPI.getViewportSize = viewport => {
    const vCoords = viewport.getViewport();
    const size = model.size;
    return [(vCoords[2] - vCoords[0]) * size[0], (vCoords[3] - vCoords[1]) * size[1]];
  };

  publicAPI.getViewportCenter = viewport => {
    const size = publicAPI.getViewportSize(viewport);
    return [size[0] * 0.5, size[1] * 0.5];
  };

  publicAPI.displayToNormalizedDisplay = (x, y, z) =>
    [x / (model.size[0] - 1), y / (model.size[1] - 1), z];

  publicAPI.normalizedDisplayToDisplay = (x, y, z) =>
    [x * (model.size[0] - 1), y * (model.size[1] - 1), z];

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
  canvas: null,
  size: [300, 300],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Create internal instances
  model.canvas = document.createElement('canvas');

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  model.myFactory = vtkOpenGLViewNodeFactory.newInstance();
  model.shaderCache = vtkShaderCache.newInstance();

  // Build VTK API
  macro.get(publicAPI, model, ['shaderCache']);
  macro.setGet(publicAPI, model, [
    'initialized',
    'context',
  ]);

  macro.setGetArray(publicAPI, model, [
    'size',
  ], 2);

  // Object methods
  vtkOpenGLRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
