import macro from 'vtk.js/Sources/macros';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import vtkMouseCameraTrackballRotateManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballRotateManipulator';
import vtkMouseCameraTrackballRollManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballRollManipulator';

function max(x, y) {
  return x < y ? y : x;
}

function sqr(x) {
  return x * x;
}

// ----------------------------------------------------------------------------
// vtkMouseCameraTrackballMultiRotateManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraTrackballMultiRotateManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraTrackballMultiRotateManipulator');

  const rotateManipulator =
    vtkMouseCameraTrackballRotateManipulator.newInstance();
  const rollManipulator = vtkMouseCameraTrackballRollManipulator.newInstance();
  let currentManipulator = null;

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    const viewSize = interactor.getView().getViewportSize(renderer);
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
  macro.obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseCameraTrackballMultiRotateManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballMultiRotateManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
