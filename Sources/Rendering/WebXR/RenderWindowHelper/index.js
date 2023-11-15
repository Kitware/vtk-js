import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebXR/RenderWindowHelper/Constants';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';
const { vtkWarningMacro } = macro;

const { XrSessionTypes } = Constants;

//FIXME
let LookingGlassConfig = null;
import(
  // eslint-disable-next-line import/no-unresolved, import/extensions
  /* webpackIgnore: true */ 'https://unpkg.com/@lookingglass/webxr@0.4.0/dist/bundle/webxr.js'
).then((obj) => {
  // eslint-disable-next-line no-new
  LookingGlassConfig = obj.LookingGlassConfig;
  new obj.LookingGlassWebXRPolyfill();
});

const DEFAULT_RESET_FACTORS = {
  rescaleFactor: 0.25, // isotropic scale factor reduces apparent size of objects
  translateZ: -1.5, // default translation initializes object in front of camera
};

// ----------------------------------------------------------------------------
// vtkWebXRRenderManager methods
// ----------------------------------------------------------------------------

function vtkWebXRRenderManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebXRRenderManager');

  publicAPI.initialize = (renderWindow) => {
    if (!model.initialized) {
      model.renderWindow = renderWindow;
      model.alwaysRender = true;
      model.initialized = true;
    }
  };

  publicAPI.getXrSupported = () => navigator.xr !== undefined;

  publicAPI.isSessionHMD = (xrSessionType) =>
    [XrSessionTypes.HmdVR, XrSessionTypes.HmdAR].includes(xrSessionType);

  publicAPI.isSessionAR = (xrSessionType) =>
    [XrSessionTypes.HmdAR, XrSessionTypes.MobileAR].includes(xrSessionType);

  // Request an XR session on the user device with WebXR,
  // typically in response to a user request such as a button press
  publicAPI.startXR = (xrSessionType, referenceSpace) => {
    if (navigator.xr === undefined) {
      throw new Error('WebXR is not available');
    }
    if (xrSessionType === undefined || xrSessionType === null) {
      throw new Error('Must request an XR session type');
    }
    if (model.xrSession) {
      throw new Error('XR Session already exists!');
    }

    if (referenceSpace === undefined || referenceSpace === null) {
      referenceSpace = 'local';
    }

    const sessionType = publicAPI.isSessionAR(xrSessionType)
      ? 'immersive-ar'
      : 'immersive-vr';
    if (!navigator.xr.isSessionSupported(sessionType)) {
      if (publicAPI.isSessionAR(xrSessionType)) {
        throw new Error('Device does not support AR session');
      } else {
        throw new Error('Device does not support VR session');
      }
    }

    navigator.xr.requestSession(sessionType).then(
      (xrSession) => {
        model.xrSessionType = xrSessionType;
        publicAPI.enterXR(xrSession, referenceSpace);
      },
      () => {
        model.xrSessionType = null;
        throw new Error('Failed to create XR session!');
      }
    );
  };

  // When an XR session is available, set up the XRWebGLLayer
  // and request the first animation frame for the device
  publicAPI.enterXR = async (xrSession, referenceSpace) => {
    if (!xrSession) {
      throw new Error('Failed to enter XR with a null xrSession.');
    }

    model.xrSession = xrSession;
    model.initCanvasSize = model.renderWindow.getSize();

    const gl = model.renderWindow.get3DContext();
    await gl.makeXRCompatible();

    // XRWebGLLayer definition is deferred to here to give any WebXR polyfill
    // an opportunity to override this definition.
    const { XRWebGLLayer } = window;
    const glLayer = new XRWebGLLayer(
      model.xrSession,
      // constructor needs unproxied context
      gl[GET_UNDERLYING_CONTEXT]()
    );
    model.renderWindow.setSize(
      glLayer.framebufferWidth,
      glLayer.framebufferHeight
    );

    model.xrSession.updateRenderState({
      baseLayer: glLayer,
    });

    if (referenceSpace !== 'local') {
      vtkWarningMacro(
        'VTK.js expects "local" XRReferenceSpace but received: ' +
          referenceSpace
      );
    }
    model.xrSession.requestReferenceSpace(referenceSpace).then((refSpace) => {
      model.xrReferenceSpace = refSpace;
    });

    // Initialize transparent background for augmented reality session
    if (publicAPI.isSessionAR(model.xrSessionType)) {
      const ren = model.renderWindow.getRenderable().getRenderers()[0];
      model.initBackground = ren.getBackground();
      ren.setBackground([0, 0, 0, 0]);
    }

    publicAPI.resetXRScene();

    model.renderWindow.getRenderable().getInteractor().switchToXRAnimation();
    model.xrSceneFrame = model.xrSession.requestAnimationFrame(model.xrRender);

    publicAPI.modified();
  };

  publicAPI.resetXRScene = (
    rescaleFactor = DEFAULT_RESET_FACTORS.rescaleFactor,
    translateZ = DEFAULT_RESET_FACTORS.translateZ
  ) => {
    // Adjust world-to-physical parameters for different modalities

    const ren = model.renderWindow.getRenderable().getRenderers()[0];
    ren.resetCamera();

    const camera = ren.getActiveCamera();
    let physicalScale = camera.getPhysicalScale();
    const physicalTranslation = camera.getPhysicalTranslation();

    const rescaledTranslateZ = translateZ * physicalScale;
    physicalScale /= rescaleFactor;
    physicalTranslation[2] += rescaledTranslateZ;

    camera.setPhysicalScale(physicalScale);
    camera.setPhysicalTranslation(physicalTranslation);
    // Clip at 0.1m, 100.0m in physical space by default
    camera.setClippingRange(0.1 * physicalScale, 100.0 * physicalScale);
  };

  publicAPI.stopXR = async () => {
    if (navigator.xr === undefined) {
      // WebXR polyfill not available so nothing to do
      return;
    }

    if (model.xrSession !== null) {
      model.xrSession.cancelAnimationFrame(model.xrSceneFrame);
      model.renderWindow
        .getRenderable()
        .getInteractor()
        .returnFromXRAnimation();
      const gl = model.renderWindow.get3DContext();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      await model.xrSession.end().catch((error) => {
        if (!(error instanceof DOMException)) {
          throw error;
        }
      });
      model.xrSession = null;
    }

    if (model.initCanvasSize !== null) {
      model.renderWindow.setSize(...model.initCanvasSize);
    }

    // Reset to default canvas
    const ren = model.renderWindow.getRenderable().getRenderers()[0];

    if (model.initBackground != null) {
      ren.setBackground(model.initBackground);
      model.initBackground = null;
    }

    ren.getActiveCamera().setProjectionMatrix(null);
    ren.resetCamera();

    ren.setViewport(0.0, 0, 1.0, 1.0);
    model.renderWindow.traverseAllPasses();

    publicAPI.modified();
  };

  model.xrRender = async (t, frame) => {
    const xrSession = frame.session;

    model.renderWindow
      .getRenderable()
      .getInteractor()
      .updateXRGamepads(xrSession, frame, model.xrReferenceSpace);

    if (model.alwaysRender) {
      model.xrSceneFrame = model.xrSession.requestAnimationFrame(model.xrRender);
    }

    const xrPose = frame.getViewerPose(model.xrReferenceSpace);

    if (xrPose) {
      const gl = model.renderWindow.get3DContext({preserveDrawingBuffer: true});

      if (
        model.xrSessionType === XrSessionTypes.MobileAR &&
        model.initCanvasSize !== null
      ) {
        gl.canvas.width = model.initCanvasSize[0];
        gl.canvas.height = model.initCanvasSize[1];
      }

      const glLayer = xrSession.renderState.baseLayer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      model.renderWindow.setSize(
        glLayer.framebufferWidth,
        glLayer.framebufferHeight
      );

      // get the first renderer
      const ren = model.renderWindow.getRenderable().getRenderers()[0];

      // Do a render pass for each eye
      xrPose.views.forEach((view, index) => {
        model.setRendererViewport(ren, view, index, glLayer);

        ren
          .getActiveCamera()
          .computeViewParametersFromPhysicalMatrix(
            view.transform.inverse.matrix
          );
        ren.getActiveCamera().setProjectionMatrix(view.projectionMatrix);

        model.renderWindow.traverseAllPasses();
      });

      // Reset scissorbox before any subsequent rendering to external displays
      // on frame end, such as rendering to a Looking Glass display.
      gl.scissor(0, 0, glLayer.framebufferWidth, glLayer.framebufferHeight);
      gl.disable(gl.SCISSOR_TEST);
    }

  };

  model.setRendererViewport = (renderer, xrView, xrViewIndex, glLayer) => {
    const viewport = glLayer.getViewport(xrView);

    if (publicAPI.isSessionHMD(model.xrSessionType)) {
      if (xrView.eye === 'left') {
        renderer.setViewport(0, 0, 0.5, 1.0);
      } else if (xrView.eye === 'right') {
        renderer.setViewport(0.5, 0, 1.0, 1.0);
      } else {
        // No handling for non-eye viewport
        // pass
      }
    } else if (model.xrSessionType === XrSessionTypes.LookingGlassVR) {
      const startX = viewport.x / glLayer.framebufferWidth;
      const startY = viewport.y / glLayer.framebufferHeight;
      const endX = (viewport.x + viewport.width) / glLayer.framebufferWidth;
      const endY = (viewport.y + viewport.height) / glLayer.framebufferHeight;
      renderer.setViewport(startX, startY, endX, endY);
    } else {
      renderer.setViewport(0, 0, 1, 1);
    }
  };

  publicAPI.delete = macro.chain(publicAPI.delete);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  initialized: false,
  initCanvasSize: null,
  initBackground: null,
  renderWindow: null,
  xrSession: null,
  xrSessionType: 0,
  xrReferenceSpace: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');

  macro.get(publicAPI, model, ['xrSession', 'xrSessionType']);
  macro.setGet(publicAPI, model, ['renderWindow']);

  // Object methods
  vtkWebXRRenderManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebXRRenderManager');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
