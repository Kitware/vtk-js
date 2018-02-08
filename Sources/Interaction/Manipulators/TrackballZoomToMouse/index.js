import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkTrackballZoom from 'vtk.js/Sources/Interaction/Manipulators/TrackballZoom';

// ----------------------------------------------------------------------------
// vtkTrackballZoomToMouse methods
// ----------------------------------------------------------------------------

function vtkTrackballZoomToMouse(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballZoomToMouse');

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
  vtkTrackballZoom.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkTrackballZoomToMouse(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTrackballZoomToMouse');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
