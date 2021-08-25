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
    previousPosition: null,
  };

  //--------------------------------------------------------------------------

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    internal.previousPosition = position;

    if (model.usePointerLock && !interactor.isPointerLocked()) {
      Object.assign(internal, { interactor, renderer });
      interactor.requestPointerLock();
      publicAPI.startPointerLockInteraction();
    }
  };

  //--------------------------------------------------------------------------

  publicAPI.startPointerLockInteraction = () => {
    const { interactor } = internal;

    // TODO: at some point, this should perhaps be done in
    // RenderWindowInteractor instead of here.
    // We need to hook into mousemove directly for two reasons:
    // 1. We need to keep receiving mouse move events after the mouse button
    //    is released. This is currently not possible with
    //    vtkInteractorStyleManipulator.
    // 2. Since the mouse is stationary in pointer lock mode, we need the
    //    event.movementX and event.movementY info, which are not currently
    //    passed via interactor.onMouseMove.
    document.addEventListener('mousemove', publicAPI.onPointerLockMove);

    let subscription = null;
    const endInteraction = () => {
      document.removeEventListener('mousemove', publicAPI.onPointerLockMove);
      subscription.unsubscribe();
    };
    subscription = interactor.onEndPointerLock(endInteraction);
  };

  //--------------------------------------------------------------------------

  publicAPI.onPointerLockMove = (e) => {
    const sensitivity = model.sensitivity;
    const yaw = -1 * e.movementX * sensitivity;
    const pitch = -1 * e.movementY * sensitivity;

    publicAPI.moveCamera(yaw, pitch);
  };

  //--------------------------------------------------------------------------

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    // This is currently only being called for non pointer lock mode
    if (!position) {
      return;
    }

    const { previousPosition } = internal;

    const sensitivity = model.sensitivity;
    const yaw = (previousPosition.x - position.x) * sensitivity;
    const pitch = (position.y - previousPosition.y) * sensitivity;

    Object.assign(internal, { interactor, renderer });
    publicAPI.moveCamera(yaw, pitch);

    internal.previousPosition = position;
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
