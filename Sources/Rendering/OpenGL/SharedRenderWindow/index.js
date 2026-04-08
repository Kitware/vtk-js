import macro from 'vtk.js/Sources/macros';
import { extend as extendOpenGLRenderWindow } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkSharedRenderer from 'vtk.js/Sources/Rendering/OpenGL/SharedRenderer';

const PIXEL_STORE_STATE = [
  ['packAlignment', 'PACK_ALIGNMENT', 4],
  ['unpackAlignment', 'UNPACK_ALIGNMENT', 4],
  ['unpackFlipY', 'UNPACK_FLIP_Y_WEBGL', false],
  ['unpackPremultiplyAlpha', 'UNPACK_PREMULTIPLY_ALPHA_WEBGL', false],
  [
    'unpackColorspaceConversion',
    'UNPACK_COLORSPACE_CONVERSION_WEBGL',
    'BROWSER_DEFAULT_WEBGL',
  ],
  ['packRowLength', 'PACK_ROW_LENGTH', 0],
  ['packSkipRows', 'PACK_SKIP_ROWS', 0],
  ['packSkipPixels', 'PACK_SKIP_PIXELS', 0],
  ['unpackRowLength', 'UNPACK_ROW_LENGTH', 0],
  ['unpackImageHeight', 'UNPACK_IMAGE_HEIGHT', 0],
  ['unpackSkipRows', 'UNPACK_SKIP_ROWS', 0],
  ['unpackSkipPixels', 'UNPACK_SKIP_PIXELS', 0],
  ['unpackSkipImages', 'UNPACK_SKIP_IMAGES', 0],
];

function getSupportedState(gl, stateSpecs) {
  return stateSpecs.filter(([, valueName]) => gl[valueName] !== undefined);
}

function isWebGL2Context(gl) {
  return (
    typeof WebGL2RenderingContext !== 'undefined' &&
    gl instanceof WebGL2RenderingContext
  );
}

function getDefaultDrawBuffers(gl) {
  const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  return framebuffer ? [gl.COLOR_ATTACHMENT0] : [gl.BACK];
}

function applyVTKRenderDefaults(gl) {
  gl.blendFuncSeparate(
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA
  );
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
}

function resetGLState(gl, shaderCache, options = {}) {
  const pixelStoreState = getSupportedState(gl, PIXEL_STORE_STATE);

  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.disable(gl.SCISSOR_TEST);
  gl.disable(gl.STENCIL_TEST);
  if (gl.SAMPLE_ALPHA_TO_COVERAGE) {
    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
  }

  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.ONE, gl.ZERO);
  gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);
  gl.blendColor(0, 0, 0, 0);

  gl.colorMask(true, true, true, true);
  gl.clearColor(0, 0, 0, 0);

  gl.depthMask(true);
  gl.depthFunc(gl.LESS);
  gl.clearDepth(1);

  gl.stencilMask(0xffffffff);
  gl.stencilFunc(gl.ALWAYS, 0, 0xffffffff);
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
  gl.clearStencil(0);

  gl.cullFace(gl.BACK);
  gl.frontFace(gl.CCW);

  gl.polygonOffset(0, 0);

  gl.activeTexture(gl.TEXTURE0);

  pixelStoreState.forEach(([, paramName, defaultValue]) => {
    const value =
      typeof defaultValue === 'string' ? gl[defaultValue] : defaultValue;
    gl.pixelStorei(gl[paramName], value);
  });

  if (gl.bindRenderbuffer) {
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  gl.useProgram(null);

  gl.lineWidth(1);

  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  gl.scissor(0, 0, width, height);
  gl.viewport(0, 0, width, height);

  if (gl.bindVertexArray) {
    gl.bindVertexArray(null);
  }

  if (gl.drawBuffers) {
    gl.drawBuffers(options.drawBuffers || getDefaultDrawBuffers(gl));
  }

  applyVTKRenderDefaults(gl);

  if (shaderCache) {
    shaderCache.setLastShaderProgramBound(null);
  }
}

function vtkSharedRenderWindow(publicAPI, model) {
  model.classHierarchy.push('vtkSharedRenderWindow');

  publicAPI
    .getViewNodeFactory()
    .registerOverride('vtkRenderer', vtkSharedRenderer.newInstance);

  let renderEventSubscription = null;
  let renderCallback = null;
  let suppressRenderEvent = false;
  let savedEnableRender = null;
  const superGet3DContext = publicAPI.get3DContext;

  function getInteractor() {
    return model.renderable?.getInteractor?.();
  }

  function clearRenderEventSubscription() {
    if (renderEventSubscription) {
      renderEventSubscription.unsubscribe();
      renderEventSubscription = null;
    }
  }

  function bindRenderEvent(interactor) {
    if (!interactor?.onRenderEvent || !renderCallback) {
      return;
    }

    renderEventSubscription = interactor.onRenderEvent(() => {
      if (!suppressRenderEvent) {
        renderCallback?.();
      }
    });
  }

  publicAPI.renderShared = (options = {}) => {
    publicAPI.prepareSharedRender(options);
    try {
      if (model.renderable) {
        if (renderCallback && !renderEventSubscription) {
          publicAPI.setRenderCallback(renderCallback);
        }

        const interactor = getInteractor();
        let previousEnableRender;
        if (interactor?.getEnableRender) {
          previousEnableRender = interactor.getEnableRender();
          if (!previousEnableRender) {
            interactor.setEnableRender(true);
          }
        }

        suppressRenderEvent = true;
        try {
          model.renderable.preRender?.();
          if (interactor) {
            interactor.render();
          } else {
            const views = model.renderable.getViews?.() || [];
            views.forEach((view) => view.traverseAllPasses());
          }
        } finally {
          suppressRenderEvent = false;
          if (
            interactor?.setEnableRender &&
            previousEnableRender !== undefined
          ) {
            interactor.setEnableRender(previousEnableRender);
          }
        }
      }
    } finally {
      const shaderCache = publicAPI.getShaderCache();
      if (shaderCache) {
        shaderCache.setLastShaderProgramBound(null);
      }
    }
  };

  publicAPI.get3DContext = (options) => {
    if (model.context) {
      return model.context;
    }
    return superGet3DContext(options);
  };

  /**
   * Sync internal size state from the canvas's actual drawing buffer dimensions.
   * Use this when sharing a WebGL context with another library (like MapLibre)
   * that manages the canvas size. Returns true if size changed.
   */
  publicAPI.syncSizeFromCanvas = () => {
    if (!model.context) return false;
    const width = model.context.drawingBufferWidth;
    const height = model.context.drawingBufferHeight;
    return publicAPI.setSize(width, height);
  };

  publicAPI.prepareSharedRender = (options = {}) => {
    publicAPI.syncSizeFromCanvas();
    const gl = model.context;
    if (!gl) return;
    resetGLState(gl, publicAPI.getShaderCache(), options);
  };

  publicAPI.setRenderCallback = (callback) => {
    renderCallback = callback || null;
    clearRenderEventSubscription();

    const interactor = getInteractor();
    if (renderCallback && interactor?.onRenderEvent) {
      // Render requests flow through the interactor RenderEvent; redirect those
      // to the host render loop while keeping draw calls inside renderShared().
      if (savedEnableRender === null && interactor.getEnableRender) {
        savedEnableRender = interactor.getEnableRender();
      }
      interactor?.setEnableRender?.(false);
      bindRenderEvent(interactor);
      return;
    }

    if (!renderCallback && interactor && savedEnableRender !== null) {
      interactor.setEnableRender?.(savedEnableRender);
      savedEnableRender = null;
    }
  };

  publicAPI.delete = macro.chain(() => {
    clearRenderEventSubscription();
    if (savedEnableRender !== null) {
      const interactor = getInteractor();
      interactor?.setEnableRender?.(savedEnableRender);
      savedEnableRender = null;
    }
    renderCallback = null;
  }, publicAPI.delete);
}

const DEFAULT_VALUES = {
  autoClear: false,
  autoClearColor: true,
  autoClearDepth: true,
};

export function extend(publicAPI, model, initialValues = {}) {
  const mergedValues = { ...DEFAULT_VALUES, ...initialValues };
  extendOpenGLRenderWindow(publicAPI, model, mergedValues);
  macro.setGet(publicAPI, model, [
    'autoClear',
    'autoClearColor',
    'autoClearDepth',
  ]);
  vtkSharedRenderWindow(publicAPI, model);
}

export const newInstance = macro.newInstance(extend, 'vtkSharedRenderWindow');

export function createFromContext(canvas, gl, options = {}) {
  if (!isWebGL2Context(gl)) {
    throw new Error('vtkSharedRenderWindow requires a WebGL2 context');
  }
  if (gl.canvas && gl.canvas !== canvas) {
    throw new Error(
      'vtkSharedRenderWindow requires the provided canvas to match gl.canvas'
    );
  }

  return newInstance({
    ...options,
    canvas,
    context: gl,
    manageCanvas: false,
    webgl2: true,
  });
}

export default { newInstance, extend, createFromContext };
