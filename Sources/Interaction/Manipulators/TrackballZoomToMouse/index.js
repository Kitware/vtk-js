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

  publicAPI.onButtonDown = (interactor) => {
    superOnButtonDown(interactor);
    model.zoomPosition = interactor.getEventPosition(
      interactor.getPointerIndex()
    );
  };

  publicAPI.onAnimation = (interactor, renderer) => {
    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);
    const lastPos = interactor.getLastAnimationEventPosition(lastPtr);

    if (!pos || !lastPos || !renderer) {
      return;
    }

    const dy = lastPos.y - pos.y;
    const k = dy * model.zoomScale;
    vtkInteractorStyleManipulator.dollyToPosition(
      1.0 - k,
      model.zoomPosition,
      renderer,
      interactor
    );
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
