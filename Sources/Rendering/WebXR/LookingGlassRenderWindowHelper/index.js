import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebXR/RenderWindowHelper/Constants';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkWebXRRenderWindowHelper from 'vtk.js/Sources/Rendering/WebXR/RenderWindowHelper';
const { XrSessionTypes } = Constants;

//FIXME
// let LookingGlassConfig = null;
// import(
//   // eslint-disable-next-line import/no-unresolved, import/extensions
//   /* webpackIgnore: true */ 'https://unpkg.com/@lookingglass/webxr@0.4.0/dist/bundle/webxr.js'
// ).then((obj) => {
//   // eslint-disable-next-line no-new
//   LookingGlassConfig = obj.LookingGlassConfig;
//   new obj.LookingGlassWebXRPolyfill();
// });

// const DEFAULT_RESET_FACTORS = {
//   rescaleFactor: 0.25, // isotropic scale factor reduces apparent size of objects
//   translateZ: -1.5, // default translation initializes object in front of camera
// };

const LOOKING_GLASS_PACKAGE_REF =
  'https://unpkg.com/@lookingglass/webxr@0.4.0/dist/bundle/webxr.js';


// ----------------------------------------------------------------------------
// vtkWebXRLookingGlassRenderWindowHelper methods
// ----------------------------------------------------------------------------

function vtkWebXRLookingGlassRenderWindowHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLookingGlassWebXRRenderMethod');

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
        superClass.initialize(renderWindow);
        model.alwaysRender = false;
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
    if (xrSessionType && xrSessionType !== XrSessionTypes.LookingGlassVR) {
      throw new Error('Expected Looking Glass session');
    }
    if (!navigator.xr.isSessionSupported(LOOKING_GLASS_SESSION_TYPE)) {
      throw new Error('Looking Glass display is not available');
    }
    navigator.xr
      .requestSession(LOOKING_GLASS_SESSION_TYPE)
      .then((xrSession) => {
        model.xrSessionType = xrSessionType;
          publicAPI.enterXR(xrSession, 'local')
        },
        () => {
        model.xrSessionType = null;
        throw new Error('Failed to create XR session!');
      });
  };

  // When an XR session is available, set up the XRWebGLLayer
  // and request the first animation frame for the device
  publicAPI.enterXR = async (xrSession, referenceSpace) => {
    if (!xrSession) {
      throw new Error('Failed to enter null XR session');
    }
    await superClass.enterXR(xrSession, referenceSpace);

    console.log(model.lookingGlassConfig);
    if (model.lookingGlassConfig.lkgCanvas) {
      /*model.lkgInteractor = vtkRenderWindowInteractor.newInstance();
        //model.lkgInteractor = model.renderWindow.getRenderable().getInteractor();
        model.lkgInteractor.setView(model.renderWindow);
        model.lkgInteractor.bindEvents(model.lookingGlassConfig.lkgCanvas);ctor[`onPointerEnter`]((callData) => {
            console.log('animate');
        });*/
      model.lookingGlassConfig.lkgCanvas.addEventListener(
        'pointermove',
        function () {
          model.xrSceneFrame = model.xrSession.requestAnimationFrame(
            model.xrRender
          );
        }
      );
      //model.lkgIntera;
    }
  };

  publicAPI.stopXR = async () => {
    // TODO detach from looking glass canvas
    await superClass.stopXR();
  };

  model.setRendererViewport = (renderer, xrView, xrViewIndex, glLayer) => {
    const viewport = glLayer.getViewport(xrView);
    if (model.xrSessionType !== XrSessionTypes.LookingGlassVR) {
      throw new Error(
        'Expected Looking Glass XR session but found type ' +
          model.xrSessionType
      );
    }

    const startX = viewport.x / glLayer.framebufferWidth;
    const startY = viewport.y / glLayer.framebufferHeight;
    const endX = (viewport.x + viewport.width) / glLayer.framebufferWidth;
    const endY = (viewport.y + viewport.height) / glLayer.framebufferHeight;
    renderer.setViewport(startX, startY, endX, endY);
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
