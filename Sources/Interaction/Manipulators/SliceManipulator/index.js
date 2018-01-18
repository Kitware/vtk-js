import macro from 'vtk.js/Sources/macro';
import vtkCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkSliceManipulator methods
// ----------------------------------------------------------------------------

function vtkSliceManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSliceManipulator');

  publicAPI.onAnimation = (interactor, renderer) => {
    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);
    const lastPos = interactor.getLastAnimationEventPosition(lastPtr);

    if (!pos || !lastPos || !renderer) {
      return;
    }

    const dy = pos.y - lastPos.y;

    const camera = renderer.getActiveCamera();
    const range = camera.getClippingRange();
    let distance = camera.getDistance();

    // scale the interaction by the height of the viewport
    let viewportHeight = 0.0;
    if (camera.getParallelProjection()) {
      viewportHeight = camera.getParallelScale();
    } else {
      const angle = vtkMath.radiansFromDegrees(camera.getViewAngle());
      viewportHeight = 2.0 * distance * Math.tan(0.5 * angle);
    }

    const size = interactor.getView().getViewportSize(renderer);
    const delta = dy * viewportHeight / size[1];
    distance += delta;

    // clamp the distance to the clipping range
    if (distance < range[0]) {
      distance = range[0] + viewportHeight * 1e-3;
    }
    if (distance > range[1]) {
      distance = range[1] - viewportHeight * 1e-3;
    }
    camera.setDistance(distance);
  };

  publicAPI.onPinch = (interactor) => {
    const interactorStyle = interactor.getInteractorStyle();
    let renderer = interactorStyle.getCurrentRenderer();

    if (!renderer) {
      const pos = interactor.getAnimationEventPosition(
        interactor.getPointerIndex()
      );
      renderer = interactor.findPokedRenderer(pos);
      if (!renderer) {
        return;
      }
    }

    let delta = interactor.getScale() / interactor.getLastScale();
    delta = 1.0 - delta;
    delta *= 25; // TODO: expose factor?

    const camera = renderer.getActiveCamera();
    const range = camera.getClippingRange();
    let distance = camera.getDistance();
    distance += delta;

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
  vtkCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkSliceManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSliceManipulator');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
