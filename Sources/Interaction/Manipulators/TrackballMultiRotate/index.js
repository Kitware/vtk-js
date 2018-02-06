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

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    const viewSize = interactor.getView().getSize();
    const viewCenter = [0.5 * viewSize[0], 0.5 * viewSize[1]];
    const rotateRadius = 0.9 * max(viewCenter[0], viewCenter[1]);
    const dist2 =
      sqr(viewCenter[0] - position.x) + sqr(viewCenter[1] - position.y);

    if (rotateRadius * rotateRadius > dist2) {
      currentManipulator = rotateManipulator;
    } else {
      currentManipulator = rollManipulator;
    }

    currentManipulator.setButton(publicAPI.getButton());
    currentManipulator.setShift(publicAPI.getShift());
    currentManipulator.setControl(publicAPI.getControl());
    currentManipulator.setCenter(publicAPI.getCenter());

    currentManipulator.onButtonDown(interactor, position);
  };

  publicAPI.onButtonUp = (interactor) => {
    if (currentManipulator) {
      currentManipulator.onButtonUp(interactor);
    }
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (currentManipulator) {
      currentManipulator.onMouseMove(interactor, renderer, position);
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
