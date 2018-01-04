import macro from 'vtk.js/Sources/macro';
import vtkCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';
import vtkTrackballRotate from 'vtk.js/Sources/Interaction/Manipulators/TrackballRotate';
import vtkTrackballRoll from 'vtk.js/Sources/Interaction/Manipulators/TrackballRoll';

function max(x, y) {
  return x < y ? y : x;
}

function sqr(x) {
  return x * x;
}

// ----------------------------------------------------------------------------
// vtkTrackballMultiRotate methods
// ----------------------------------------------------------------------------

function vtkTrackballMultiRotate(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballMultiRotate');

  const rotateManipulator = vtkTrackballRotate.newInstance();
  const rollManipulator = vtkTrackballRoll.newInstance();
  let currentManipulator = null;

  publicAPI.onButtonDown = (interactor) => {
    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);

    if (!pos) {
      return;
    }

    const viewSize = interactor.getView().getSize();
    const viewCenter = [0.5 * viewSize[0], 0.5 * viewSize[1]];
    const rotateRadius = 0.9 * max(viewCenter[0], viewCenter[1]);
    const dist2 = sqr(viewCenter[0] - pos.x) + sqr(viewCenter[1] - pos.y);

    if (rotateRadius * rotateRadius > dist2) {
      currentManipulator = rotateManipulator;
    } else {
      currentManipulator = rollManipulator;
    }

    currentManipulator.setButton(publicAPI.getButton());
    currentManipulator.setShift(publicAPI.getShift());
    currentManipulator.setControl(publicAPI.getControl());
    currentManipulator.setCenter(publicAPI.getCenter());

    currentManipulator.onButtonDown(interactor);
  };

  publicAPI.onButtonUp = (interactor) => {
    if (currentManipulator) {
      currentManipulator.onButtonUp(interactor);
    }
  };

  publicAPI.onAnimation = (interactor, renderer) => {
    if (currentManipulator) {
      currentManipulator.onAnimation(interactor, renderer);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkTrackballMultiRotate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTrackballMultiRotate');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
