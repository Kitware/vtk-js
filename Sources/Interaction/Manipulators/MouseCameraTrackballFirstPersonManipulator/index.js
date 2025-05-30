import macro from 'vtk.js/Sources/macros';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';

const ANIMATION_REQUESTER = 'vtkMouseCameraTrackballFirstPersonManipulator';

// ----------------------------------------------------------------------------
// vtkMouseCameraTrackballFirstPersonManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraTrackballFirstPersonManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraTrackballFirstPersonManipulator');

  const internal = {
    interactor: null,
    renderer: null,
  };

  //--------------------------------------------------------------------------

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    if (model.usePointerLock && !interactor.isPointerLocked()) {
      Object.assign(internal, { interactor, renderer });
      interactor.requestPointerLock();
    }
  };

  //--------------------------------------------------------------------------

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }

    const sensitivity = model.sensitivity;
    const yaw = -position.movementX * sensitivity;
    const pitch = -position.movementY * sensitivity;

    Object.assign(internal, { interactor, renderer });
    publicAPI.moveCamera(yaw, pitch);
  };

  //--------------------------------------------------------------------------

  publicAPI.moveCamera = (yaw, pitch) => {
    const { renderer, interactor } = internal;

    const camera = renderer.getActiveCamera();

    // We need to pick a number of steps here that is not too few
    // (or the camera will be jittery) and not too many (or the
    // animations will take too long).
    // Perhaps this should be calculated?
    const numSteps = model.numAnimationSteps;
    const yawStep = yaw / numSteps;
    const pitchStep = pitch / numSteps;

    const now = performance.now().toString();
    const animationRequester = `${ANIMATION_REQUESTER}.${now}`;

    let curStep = 0;
    let animationSub = null;
    const performStep = () => {
      camera.yaw(yawStep);
      camera.pitch(pitchStep);
      camera.orthogonalizeViewUp();
      curStep += 1;
      if (curStep === numSteps) {
        animationSub.unsubscribe();
        renderer.resetCameraClippingRange();

        if (interactor.getLightFollowCamera()) {
          renderer.updateLightsGeometryToFollowCamera();
        }

        // This needs to be posted to the event loop so it isn't called
        // in the `handleAnimation` stack, or else the animation will
        // not be canceled.
        const cancelRequest = () => {
          internal.interactor.cancelAnimation(animationRequester);
        };
        setTimeout(cancelRequest, 0);
      }
    };

    interactor.requestAnimation(animationRequester);
    animationSub = interactor.onAnimation(() => performStep());
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numAnimationSteps: 5,
  sensitivity: 0.05,
  usePointerLock: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'numAnimationSteps',
    'sensitivity',
    'usePointerLock',
  ]);

  // Object specific methods
  vtkMouseCameraTrackballFirstPersonManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballFirstPersonManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
