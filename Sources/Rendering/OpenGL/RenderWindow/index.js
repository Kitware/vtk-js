import * as macro from '../../../macro';
import vtkOpenGLViewNodeFactory from '../ViewNodeFactory';
import vtkShaderCache from '../ShaderCache';
import vtkViewNode from '../../SceneGraph/ViewNode';
import vtkOpenGLTextureUnitManager from '../TextureUnitManager';

/* global document */

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
      model.textureUnitManager = vtkOpenGLTextureUnitManager.newInstance();
      model.textureUnitManager.setContext(model.context);
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

  publicAPI.activateTexture = texture => {
    // Only add if it isn't already there
    const result = model.textureResourceIds.get(texture);
    if (result !== undefined) {
      model.context.activeTexture(model.context.TEXTURE0 + result);
      return;
    }

    const activeUnit = publicAPI.getTextureUnitManager().allocate();
    if (activeUnit < 0) {
      vtkErrorMacro('Hardware does not support the number of textures defined.');
      return;
    }

    model.textureResourceIds.set(texture, activeUnit);
    model.context.activeTexture(model.context.TEXTURE0 + activeUnit);
  };

  publicAPI.deactivateTexture = texture => {
    // Only deactivate if it isn't already there
    const result = model.textureResourceIds.get(texture);
    if (result !== undefined) {
      publicAPI.getTextureUnitManager().free(result);
      delete model.textureResourceIds.delete(texture);
    }
  };

  publicAPI.getTextureUnitForTexture = texture => {
    const result = model.textureResourceIds.get(texture);
    if (result !== undefined) {
      return result;
    }
    return -1;
  };

  publicAPI.getDefaultTextureInternalFormat = (vtktype, numComps, useFloat) => {
    // currently only supports four types
    switch (numComps) {
      case 1: return model.context.LUMINANCE;
      case 2: return model.context.LUMINANCE_ALPHA;
      case 3: return model.context.RGB;
      case 4:
      default:
        return model.context.RGBA;
    }
  };

  publicAPI.captureImage = (format = 'image/png') => model.canvas.toDataURL(format);
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
  cursorVisibility: true,
  cursor: 'pointer',
  textureUnitManager: null,
  textureResourceIds: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Create internal instances
  model.canvas = document.createElement('canvas');

  model.textureResourceIds = new Map();

  // Inheritance
  vtkViewNode.extend(publicAPI, model);

  model.myFactory = vtkOpenGLViewNodeFactory.newInstance();
  model.shaderCache = vtkShaderCache.newInstance();

  // Build VTK API
  macro.get(publicAPI, model, [
    'shaderCache',
    'textureUnitManager',
  ]);

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
