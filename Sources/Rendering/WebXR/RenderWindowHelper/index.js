import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebXR/RenderWindowHelper/Constants';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';

const { XrSessionTypes } = Constants;

const DEFAULT_RESET_FACTORS = {
  rescaleFactor: 0.25, // isotropic scale factor reduces apparent size of objects
  translateZ: -1.5, // default translation initializes object in front of camera
};

// ----------------------------------------------------------------------------
// vtkWebXRRenderWindowHelper methods
// ----------------------------------------------------------------------------

function vtkWebXRRenderWindowHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebXRRenderWindowHelper');

  publicAPI.initialize = (renderWindow) => {
    if (!model.initialized) {
      model.renderWindow = renderWindow;
      model.initialized = true;
    }
  };

  publicAPI.getXrSupported = () => navigator.xr !== undefined;

  // Request an XR session on the user device with WebXR,
  // typically in response to a user request such as a button press
  publicAPI.startXR = (xrSessionType) => {
    if (navigator.xr === undefined) {
      throw new Error('WebXR is not available');
    }

    model.xrSessionType =
      xrSessionType !== undefined ? xrSessionType : XrSessionTypes.HmdVR;
    const isXrSessionAR = [
      XrSessionTypes.HmdAR,
      XrSessionTypes.MobileAR,
    ].includes(model.xrSessionType);
    const sessionType = isXrSessionAR ? 'immersive-ar' : 'immersive-vr';
    if (!navigator.xr.isSessionSupported(sessionType)) {
      if (isXrSessionAR) {
        throw new Error('Device does not support AR session');
      } else {
        throw new Error('VR display is not available');
      }
    }
    if (model.xrSession === null) {
      navigator.xr.requestSession(sessionType).then(publicAPI.enterXR, () => {
        throw new Error('Failed to create XR session!');
      });
    } else {
      throw new Error('XR Session already exists!');
    }
  };

  // When an XR session is available, set up the XRWebGLLayer
  // and request the first animation frame for the device
  publicAPI.enterXR = async (xrSession) => {
    model.xrSession = xrSession;
    model.initCanvasSize = model.renderWindow.getSize();

    if (model.xrSession !== null) {
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

      model.xrSession.requestReferenceSpace('local').then((refSpace) => {
        model.xrReferenceSpace = refSpace;
      });

      // Initialize transparent background for augmented reality session
      const isXrSessionAR = [
        XrSessionTypes.HmdAR,
        XrSessionTypes.MobileAR,
      ].includes(model.xrSessionType);
      if (isXrSessionAR) {
        const ren = model.renderWindow.getRenderable().getRenderers()[0];
        model.initBackground = ren.getBackground();
        ren.setBackground([0, 0, 0, 0]);
      }

      publicAPI.resetXRScene();

      model.renderWindow.getRenderable().getInteractor().switchToXRAnimation();
      model.xrSceneFrame = model.xrSession.requestAnimationFrame(
        model.xrRender
      );

      publicAPI.modified();
    } else {
      throw new Error('Failed to enter XR with a null xrSession.');
    }
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
    const isXrSessionHMD = [
      XrSessionTypes.HmdVR,
      XrSessionTypes.HmdAR,
    ].includes(model.xrSessionType);

    model.renderWindow
      .getRenderable()
      .getInteractor()
      .updateXRGamepads(xrSession, frame, model.xrReferenceSpace);

    model.xrSceneFrame = model.xrSession.requestAnimationFrame(model.xrRender);

    const xrPose = frame.getViewerPose(model.xrReferenceSpace);

    if (xrPose) {
      const gl = model.renderWindow.get3DContext();

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
        const viewport = glLayer.getViewport(view);

        if (isXrSessionHMD) {
          if (view.eye === 'left') {
            ren.setViewport(0, 0, 0.5, 1.0);
          } else if (view.eye === 'right') {
            ren.setViewport(0.5, 0, 1.0, 1.0);
          } else {
            // No handling for non-eye viewport
            return;
          }
        } else if (model.xrSessionType === XrSessionTypes.LookingGlassVR) {
          const startX = viewport.x / glLayer.framebufferWidth;
          const startY = viewport.y / glLayer.framebufferHeight;
          const endX = (viewport.x + viewport.width) / glLayer.framebufferWidth;
          const endY =
            (viewport.y + viewport.height) / glLayer.framebufferHeight;
          ren.setViewport(startX, startY, endX, endY);
        } else {
          ren.setViewport(0, 0, 1, 1);
        }

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

  macro.get(publicAPI, model, ['xrSession']);
  macro.setGet(publicAPI, model, ['renderWindow']);

  // Object methods
  vtkWebXRRenderWindowHelper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebXRRenderWindowHelper'
);

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
