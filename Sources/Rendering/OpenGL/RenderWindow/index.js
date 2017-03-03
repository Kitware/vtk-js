import macro                        from 'vtk.js/Sources/macro';
import vtkOpenGLViewNodeFactory     from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';
import vtkShaderCache               from 'vtk.js/Sources/Rendering/OpenGL/ShaderCache';
import vtkViewNode                  from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkOpenGLTextureUnitManager  from 'vtk.js/Sources/Rendering/OpenGL/TextureUnitManager';

const { vtkErrorMacro } = macro;

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
      // initialize blending for transparency
      const gl = model.context;
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
                       gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
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
      model.children.forEach((child) => {
        child.setContext(model.context);
      });
    } else {
      publicAPI.frame();
    }
  };

  publicAPI.setContainer = (el) => {
    if (model.el && model.el !== el) {
      // Remove canvas from previous container
      if (model.canvas.parentNode === model.el) {
        model.el.removeChild(model.canvas);
      } else {
        vtkErrorMacro('Error: canvas parent node does not match container');
      }
    }

    if (model.el !== el) {
      model.el = el;
      if (model.el) {
        model.el.appendChild(model.canvas);
      }

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

  publicAPI.getViewportSize = (viewport) => {
    const vCoords = viewport.getViewport();
    const size = model.size;
    return [(vCoords[2] - vCoords[0]) * size[0], (vCoords[3] - vCoords[1]) * size[1]];
  };

  publicAPI.getViewportCenter = (viewport) => {
    const size = publicAPI.getViewportSize(viewport);
    return [size[0] * 0.5, size[1] * 0.5];
  };

  publicAPI.displayToNormalizedDisplay = (x, y, z) =>
    [x / (model.size[0] - 1), y / (model.size[1] - 1), z];

  publicAPI.normalizedDisplayToDisplay = (x, y, z) =>
    [x * (model.size[0] - 1), y * (model.size[1] - 1), z];

  publicAPI.getPixelData = (x1, y1, x2, y2) => {
    const pixels = new Uint8Array((x2 - x1 + 1) * (y2 - y1 + 1) * 4);
    model.context.readPixels(
      x1, y1, x2 - x1 + 1, y2 - y1 + 1,
      model.context.RGBA,
      model.context.UNSIGNED_BYTE,
      pixels);
    return pixels;
  };

  publicAPI.get2DContext = () => model.canvas.getContext('2d');

  publicAPI.get3DContext = (options = { preserveDrawingBuffer: true, depth: true, alpha: true }) => {
    let result = model.canvas.getContext('webgl', options) || model.canvas.getContext('experimental-webgl', options);
    return result;
  };

  publicAPI.activateTexture = (texture) => {
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

  publicAPI.deactivateTexture = (texture) => {
    // Only deactivate if it isn't already there
    const result = model.textureResourceIds.get(texture);
    if (result !== undefined) {
      publicAPI.getTextureUnitManager().free(result);
      delete model.textureResourceIds.delete(texture);
    }
  };

  publicAPI.getTextureUnitForTexture = (texture) => {
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

  publicAPI.captureImage = (format = 'image/png') => {
    if (model.deleted) {
      return null;
    }

    publicAPI.traverseAllPasses();
    return model.canvas.toDataURL(format);
  };
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
  vtkViewNode.extend(publicAPI, model, initialValues);

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
    'canvas',
  ]);

  macro.setGetArray(publicAPI, model, [
    'size',
  ], 2);

  // Object methods
  vtkOpenGLRenderWindow(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLRenderWindow');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
