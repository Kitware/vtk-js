import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebXR/RenderWindowHelper/Constants';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkWebXRRenderWindowHelper from 'vtk.js/Sources/Rendering/WebXR/RenderWindowHelper';
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

const LOOKING_GLASS_PACKAGE_REF =
  'https://unpkg.com/@lookingglass/webxr@0.4.0/dist/bundle/webxr.js';

// ----------------------------------------------------------------------------
// vtkWebXRLookingGlassRenderWindowHelper methods
// ----------------------------------------------------------------------------

function vtkWebXRLookingGlassRenderWindowHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebXRLookingGlassRenderWindowHelper');

  const superClass = { ...publicAPI };

  publicAPI.initialize = (renderWindow) => {
    if (!model.initialized) {
      import(
        // eslint-disable-next-line import/no-unresolved, import/extensions
        /* webpackIgnore: true */ LOOKING_GLASS_PACKAGE_REF
      ).then((obj) => {
        model.lookingGlassConfig = obj.LookingGlassConfig;
        // eslint-disable-next-line no-new
        new obj.LookingGlassWebXRPolyfill();
        model.initialized = true;
      });
    }
  };

  publicAPI.getXrSupported = () => navigator.xr !== undefined;

  // Request an XR session on the user device with WebXR,
  // typically in response to a user request such as a button press
  // Masks underlying startXR method
  publicAPI.startXR = (xrSessionType) => {
    const LOOKING_GLASS_SESSION_TYPE = 'immersive-vr';
    if (!model.initialized) {
      throw new Error('Not initialized');
    }
    if (!publicAPI.getXrSupported()) {
      throw new Error('WebXR is not available');
    }
    if (model.xrSession) {
      throw new Error('XR Session already exists!');
    }
    if (xrSessionType && xrSessionType != XrSessionTypes.LookingGlassVR) {
      throw new Error('Expected Looking Glass session');
    }

    if (!navigator.xr.isSessionSupported(LOOKING_GLASS_SESSION_TYPE)) {
      throw new Error('Looking Glass display is not available');
    }
    navigator.xr.requestSession(LOOKING_GLASS_SESSION_TYPE).then(publicAPI.enterXR, () => {
      throw new Error('Failed to create XR session!');
    });
  };

  // When an XR session is available, set up the XRWebGLLayer
  // and request the first animation frame for the device
  publicAPI.enterXR = async (xrSession) => {
    if (!xrSession) {
      throw new Error('Failed to enter null XR session');
    }
    await superClass.enterXR(xrSession);

    console.log(model.lookingGlassConfig);
    if (model.lookingGlassConfig.lkgCanvas) {
        /*model.lkgInteractor = vtkRenderWindowInteractor.newInstance();
        //model.lkgInteractor = model.renderWindow.getRenderable().getInteractor();
        model.lkgInteractor.setView(model.renderWindow);
        model.lkgInteractor.bindEvents(model.lookingGlassConfig.lkgCanvas);ctor[`onPointerEnter`]((callData) => {
            console.log('animate');
        });*/
        model.lookingGlassConfig.lkgCanvas.addEventListener('pointermove', function () {
            model.xrSceneFrame = model.xrSession.requestAnimationFrame(model.xrRender);
        });
        model.lkgIntera
    }
  };

  publicAPI.stopXR = async () => {
    if (navigator.xr === undefined) {
      // WebXR polyfill not available so nothing to do
      return;
    }

    // TODO detach from looking glass canvas
    await superClass.stopXR();
  };

  model.xrRender = async (t, frame) => {
    const xrSession = frame.session;

    model.renderWindow
      .getRenderable()
      .getInteractor()
      .updateXRGamepads(xrSession, frame, model.xrReferenceSpace);

    // FIXME
    //model.xrSceneFrame = model.xrSession.requestAnimationFrame(model.xrRender);

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

        const startX = viewport.x / glLayer.framebufferWidth;
        const startY = viewport.y / glLayer.framebufferHeight;
        const endX = (viewport.x + viewport.width) / glLayer.framebufferWidth;
        const endY = (viewport.y + viewport.height) / glLayer.framebufferHeight;
        ren.setViewport(startX, startY, endX, endY);

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
  lookingGlassConfig: null,
  renderWindow: null,
  xrSession: null,
  xrSessionType: XrSessionTypes.LookingGlassVR,
  xrReferenceSpace: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWebXRRenderWindowHelper.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');

  macro.get(publicAPI, model, ['xrSession']);
  macro.setGet(publicAPI, model, ['renderWindow']);

  // Object methods
  vtkWebXRLookingGlassRenderWindowHelper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebXRLookingGlassRenderWindowHelper'
);

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
