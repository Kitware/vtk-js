import macro from 'vtk.js/Sources/macros';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkMouseCameraSliceManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraSliceManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraSliceManipulator');

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.previousPosition = position;
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }

    const dy = position.y - model.previousPosition.y;

    const camera = renderer.getActiveCamera();
    const range = camera.getClippingRange();
    let distance = camera.getDistance();

    // scale the interaction by the height of the viewport
    let viewportHeight = 0.0;
    if (camera.getParallelProjection()) {
      viewportHeight = 2.0 * camera.getParallelScale();
    } else {
      const angle = vtkMath.radiansFromDegrees(camera.getViewAngle());
      viewportHeight = 2.0 * distance * Math.tan(0.5 * angle);
    }

    const size = interactor.getView().getViewportSize(renderer);
    const delta = (dy * viewportHeight) / size[1];
    distance += delta;

    // clamp the distance to the clipping range
    if (distance < range[0]) {
      distance = range[0] + viewportHeight * 1e-3;
    }
    if (distance > range[1]) {
      distance = range[1] - viewportHeight * 1e-3;
    }
    camera.setDistance(distance);

    model.previousPosition = position;
  };

  publicAPI.onScroll = (interactor, renderer, delta) => {
    if (!delta) {
      return;
    }

    let scrollDelta = 1.0 - delta;
    scrollDelta *= 25; // TODO: expose factor?

    const camera = renderer.getActiveCamera();
    const range = camera.getClippingRange();
    let distance = camera.getDistance();
    distance += scrollDelta;

    // clamp the distance to the clipping range
    if (distance < range[0]) {
      distance = range[0];
    }
    if (distance > range[1]) {
      distance = range[1];
    }
    camera.setDistance(distance);
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
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseCameraSliceManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraSliceManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
