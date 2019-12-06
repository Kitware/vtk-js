import macro from 'vtk.js/Sources/macro';
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

    if (model.usePointerLock) {
      Object.assign(internal, { interactor, renderer });
      publicAPI.beginPointerLockMode();
    }
  };

  //--------------------------------------------------------------------------

  publicAPI.beginPointerLockMode = () => {
    const { interactor } = internal;

    const canvas = interactor.getView().getCanvas();
    if (document.pointerLockElement === canvas) {
      // Already in pointer lock mode. Just return.
      return;
    }

    canvas.requestPointerLock();
    document.addEventListener('mousemove', publicAPI.onPointerLockMove);

    document.addEventListener(
      'pointerlockchange',
      publicAPI.endPointerLockMode
    );
    interactor.requestAnimation(ANIMATION_REQUESTER);
  };

  //--------------------------------------------------------------------------

  publicAPI.endPointerLockMode = () => {
    const { interactor } = internal;

    const canvas = interactor.getView().getCanvas();
    if (document.pointerLockElement === canvas) {
      // Still in pointer lock mode. Just return.
      return;
    }

    interactor.cancelAnimation(ANIMATION_REQUESTER);

    document.removeEventListener('mousemove', publicAPI.onPointerLockMove);
    document.removeEventListener(
      'pointerlockchange',
      publicAPI.endPointerLockMode
    );
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

    // It might be nice if we update all of these at the same time so
    // that camera.modified() doesn't get emitted multiple times.
    camera.yaw(yaw);
    camera.pitch(pitch);
    camera.orthogonalizeViewUp();

    renderer.resetCameraClippingRange();

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  sensitivity: 0.1,
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
  macro.setGet(publicAPI, model, ['sensitivity', 'usePointerLock']);

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
