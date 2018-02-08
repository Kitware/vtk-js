import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkMouseCameraTrackballZoomManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';

// ----------------------------------------------------------------------------
// vtkMouseCameraTrackballZoomToMouseManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraTrackballZoomToMouseManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraTrackballZoomToMouseManipulator');

  const superOnButtonDown = publicAPI.onButtonDown;
  publicAPI.onButtonDown = (interactor, renderer, position) => {
    superOnButtonDown(interactor, renderer, position);
    model.zoomPosition = position;
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }

    const dy = model.previousPosition.y - position.y;
    const k = dy * model.zoomScale;
    vtkInteractorStyleManipulator.dollyToPosition(
      1.0 - k,
      model.zoomPosition,
      renderer,
      interactor
    );

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }

    model.previousPosition = position;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  zoomPosition: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMouseCameraTrackballZoomManipulator.extend(
    publicAPI,
    model,
    initialValues
  );

  // Object specific methods
  vtkMouseCameraTrackballZoomToMouseManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballZoomToMouseManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
