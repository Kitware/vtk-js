import macro                        from 'vtk.js/Sources/macro';
import vtkForwardPass               from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkOpenGLViewNodeFactory     from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';
import vtkShaderCache               from 'vtk.js/Sources/Rendering/OpenGL/ShaderCache';
import vtkViewNode                  from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';
import vtkOpenGLTextureUnitManager  from 'vtk.js/Sources/Rendering/OpenGL/TextureUnitManager';
import { VtkDataTypes }             from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkDebugMacro, vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLRenderWindow methods
// ----------------------------------------------------------------------------

function vtkOpenGLRenderWindow(publicAPI, model) {
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
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      if (!model.renderable) {
        return;
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNodes(model.renderable.getRenderers());
      publicAPI.removeUnusedNodes();

      publicAPI.initialize();
      model.children.forEach((child) => {
        child.setContext(model.context);
      });
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
    [x / model.size[0], y / model.size[1], z];

  publicAPI.normalizedDisplayToDisplay = (x, y, z) =>
    [x * model.size[0], y * model.size[1], z];

  publicAPI.worldToView = (x, y, z, renderer) => {
    const dims = publicAPI.getViewportSize(renderer);
    return renderer.worldToView(x, y, z, dims[0] / dims[1]);
  };

  publicAPI.viewToWorld = (x, y, z, renderer) => {
    const dims = publicAPI.getViewportSize(renderer);
    return renderer.viewToWorld(x, y, z, dims[0] / dims[1]);
  };

  publicAPI.worldToDisplay = (x, y, z, renderer) => {
    const val = publicAPI.worldToView(x, y, z, renderer);
    const val2 = renderer.viewToNormalizedDisplay(val[0], val[1], val[2]);
    return publicAPI.normalizedDisplayToDisplay(val2[0], val2[1], val2[2]);
  };

  publicAPI.displayToWorld = (x, y, z, renderer) => {
    const val = publicAPI.displayToNormalizedDisplay(x, y, z);
    const val2 = renderer.normalizedDisplayToView(val[0], val[1], val[2]);
    return publicAPI.viewToWorld(val2[0], val2[1], val2[2], renderer);
  };

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

  publicAPI.get3DContext = (options = { preserveDrawingBuffer: false, depth: true, alpha: true }) => {
    let result = null;

    const webgl2Supported = (typeof WebGL2RenderingContext !== 'undefined');
    model.webgl2 = false;
    if (model.defaultToWebgl2 && webgl2Supported) {
      result = model.canvas.getContext('webgl2'); // , options);
      if (result) {
        model.webgl2 = true;
        vtkDebugMacro('using webgl2');
      }
    }
    if (!result) {
      result = model.canvas.getContext('webgl', options)
        || model.canvas.getContext('experimental-webgl', options);
    }
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
    if (model.webgl2) {
      switch (vtktype) {
        case VtkDataTypes.UNSIGNED_CHAR:
          switch (numComps) {
            case 1: return model.context.R8;
            case 2: return model.context.RG8;
            case 3: return model.context.RGB8;
            case 4:
            default:
              return model.context.RGBA8;
          }
        default:
        case VtkDataTypes.FLOAT:
          switch (numComps) {
            case 1: return model.context.R16F;
            case 2: return model.context.RG16F;
            case 3: return model.context.RGB16F;
            case 4:
            default:
              return model.context.RGBA16F;
          }
      }
    }

    // webgl1 only supports four types
    switch (numComps) {
      case 1: return model.context.LUMINANCE;
      case 2: return model.context.LUMINANCE_ALPHA;
      case 3: return model.context.RGB;
      case 4:
      default:
        return model.context.RGBA;
    }
  };

  function getCanvasDataURL(format = 'image/png') {
    return model.canvas.toDataURL(format);
  }

  publicAPI.captureImage = (format = 'image/png') => {
    if (model.deleted) {
      return null;
    }

    publicAPI.traverseAllPasses();
    return getCanvasDataURL(format);
  };

  publicAPI.traverseAllPasses = () => {
    model.renderPasses.forEach((val) => {
      val.traverse(publicAPI, null);
    });
    if (model.notifyImageReady) {
      publicAPI.invokeImageReady(getCanvasDataURL());
    }
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
  renderPasses: [],
  notifyImageReady: false,
  webgl2: false,
  defaultToWebgl2: false, // turned off by default
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

  // setup default forward pass rendering
  model.renderPasses[0] = vtkForwardPass.newInstance();

  macro.event(publicAPI, model, 'imageReady');

  // on mac default to webgl2
  if (navigator.appVersion.indexOf('Mac') !== -1) {
    model.defaultToWebgl2 = true;
  }

  // Build VTK API
  macro.get(publicAPI, model, [
    'shaderCache',
    'textureUnitManager',
    'webgl2',
  ]);

  macro.setGet(publicAPI, model, [
    'initialized',
    'context',
    'canvas',
    'renderPasses',
    'notifyImageReady',
    'defaultToWebgl2',
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
