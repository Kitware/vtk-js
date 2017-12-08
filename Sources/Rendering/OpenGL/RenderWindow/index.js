import macro                        from 'vtk.js/Sources/macro';
import vtkForwardPass               from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkOpenGLViewNodeFactory     from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';
import vtkRenderPass                from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
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
      publicAPI.addMissingNodes(model.renderable.getRenderersByReference());
      publicAPI.removeUnusedNodes();

      publicAPI.initialize();
      model.children.forEach((child) => {
        child.setOpenGLRenderWindow(publicAPI);
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
    const vCoords = viewport.getViewportByReference();
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
    const vCoords = viewport.getViewportByReference();
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

  publicAPI.normalizedDisplayToViewport = (x, y, z, renderer) => {
    let vCoords = renderer.getViewportByReference();
    vCoords = publicAPI.normalizedDisplayToDisplay(vCoords[0], vCoords[1], 0.0);
    const coords = publicAPI.normalizedDisplayToDisplay(x, y, z);
    return [coords[0] - vCoords[0] - 0.5, coords[1] - vCoords[1] - 0.5, z];
  };

  publicAPI.viewportToNormalizedViewport = (x, y, z, renderer) => {
    const size = publicAPI.getViewportSize(renderer);
    if (size && size[0] !== 0 && size[1] !== 0) {
      return [x / (size[0] - 1.0), y / (size[1] - 1.0), z];
    }
    return [x, y, z];
  };

  publicAPI.normalizedViewportToViewport = (x, y, z) =>
    [x * (model.size[0] - 1.0), y * (model.size[1] - 1.0), z];

  publicAPI.displayToLocalDisplay = (x, y, z) =>
    [x, model.size[1] - y - 1, z];

  publicAPI.viewportToNormalizedDisplay = (x, y, z, renderer) => {
    let vCoords = renderer.getViewportByReference();
    vCoords = publicAPI.normalizedDisplayToDisplay(vCoords[0], vCoords[1], 0.0);
    const x2 = x + vCoords[0] + 0.5;
    const y2 = y + vCoords[1] + 0.5;
    return publicAPI.displayToNormalizedDisplay(x2, y2, z);
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

    // Do we have webvr support
    if (navigator.getVRDisplays) {
      navigator.getVRDisplays().then((displays) => {
        if (displays.length > 0) {
          // take the first display for now
          model.vrDisplay = displays[0];
          // set the clipping ranges
          model.vrDisplay.depthNear = 0.01; // meters
          model.vrDisplay.depthFar = 100.0; // meters
        }
      });
    }

    // prevent default context lost handler
    model.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
    }, false);

    model.canvas.addEventListener(
      'webglcontextrestored', publicAPI.restoreContext, false);

    return result;
  };

  publicAPI.startVR = () => {
    if (model.vrDisplay.isConnected) {
      model.vrDisplay.requestPresent([{ source: model.canvas }]).then(() => {
        model.oldCanvasSize = [model.canvas.width, model.canvas.height];

        // const leftEye = model.vrDisplay.getEyeParameters('left');
        // const rightEye = model.vrDisplay.getEyeParameters('right');
        // model.canvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
        // model.canvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
        const ren = model.renderable.getRenderers()[0];
        ren.resetCamera();
        model.vrFrameData = new VRFrameData();
        model.renderable.getInteractor().switchToVRAnimation();

        publicAPI.vrRender();
      });
    } else {
      vtkErrorMacro('vrDisplay is not connected');
    }
  };

  publicAPI.stopVR = () => {
    model.renderable.getInteractor().returnFromVRAnimation();
    model.vrDisplay.exitPresent();
    model.vrDisplay.cancelAnimationFrame(model.vrSceneFrame);

    model.canvas.width = model.oldCanvasSize[0];
    model.canvas.height = model.oldCanvasSize[1];


    const ren = model.renderable.getRenderers()[0];
    ren.getActiveCamera().setProjectionMatrix(null);

    ren.setViewport(0.0, 0, 1.0, 1.0);
    publicAPI.traverseAllPasses();
  };

  publicAPI.vrRender = () => {
    model.renderable.getInteractor().updateGamepads(model.vrDisplay.displayId);
    model.vrSceneFrame = model.vrDisplay.requestAnimationFrame(publicAPI.vrRender);
    model.vrDisplay.getFrameData(model.vrFrameData);

    // get the first renderer
    const ren = model.renderable.getRenderers()[0];

    // do the left eye
    ren.setViewport(0, 0, 0.5, 1.0);
    ren.getActiveCamera().computeViewParametersFromPhysicalMatrix(
      model.vrFrameData.leftViewMatrix);
    ren.getActiveCamera().setProjectionMatrix(
      model.vrFrameData.leftProjectionMatrix);
    publicAPI.traverseAllPasses();

    ren.setViewport(0.5, 0, 1.0, 1.0);
    ren.getActiveCamera().computeViewParametersFromPhysicalMatrix(
      model.vrFrameData.rightViewMatrix);
    ren.getActiveCamera().setProjectionMatrix(
      model.vrFrameData.rightProjectionMatrix);
    publicAPI.traverseAllPasses();

    model.vrDisplay.submitFrame();
  };

  publicAPI.restoreContext = () => {
    const rp = vtkRenderPass.newInstance();
    rp.setCurrentOperation('Release');
    rp.traverse(publicAPI, null);
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
    for (let index = 0; index < model.renderPasses.length; ++index) {
      model.renderPasses[index].traverse(publicAPI, null);
    }
    if (model.notifyImageReady) {
      publicAPI.invokeImageReady(getCanvasDataURL());
    }
  };

  publicAPI.disableDepthMask = () => {
    if (model.depthMaskEnabled) {
      model.context.depthMask(false);
      model.depthMaskEnabled = false;
    }
  };

  publicAPI.enableDepthMask = () => {
    if (!model.depthMaskEnabled) {
      model.context.depthMask(true);
      model.depthMaskEnabled = true;
    }
  };

  publicAPI.disableCullFace = () => {
    if (model.cullFaceEnabled) {
      model.context.disable(model.context.CULL_FACE);
      model.cullFaceEnabled = false;
    }
  };

  publicAPI.enableCullFace = () => {
    if (!model.cullFaceEnabled) {
      model.context.enable(model.context.CULL_FACE);
      model.cullFaceEnabled = true;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cullFaceEnabled: false,
  depthMaskEnabled: true,
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

  // on linux default to webgl2
  if (navigator.platform.indexOf('Linux') !== -1) {
    model.defaultToWebgl2 = true;
  }

  // on firefox default to webgl2
  if (typeof InstallTrigger !== 'undefined') {
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
    'cursor',
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
