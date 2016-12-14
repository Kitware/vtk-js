import * as macro from '../../../macro';
import interactorStyleManipulator from '../../Style/InteractorStyleManipulator';
import vtkTrackballZoom from '../TrackballZoom';

// ----------------------------------------------------------------------------
// vtkTrackballZoomToMouse methods
// ----------------------------------------------------------------------------

function vtkTrackballZoomToMouse(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballZoomToMouse');

  const superOnButtonDown = publicAPI.onButtonDown;

  publicAPI.onButtonDown = (x, y, ren, rwi) => {
    superOnButtonDown(x, y, ren, rwi);
    model.zoomPosition = rwi.getEventPosition(rwi.getPointerIndex());
  };

  publicAPI.onMouseMove = (x, y, ren, rwi) => {
    const lastPos = rwi.getLastEventPosition(rwi.getPointerIndex());
    const dy = lastPos.y - y;
    const k = dy * model.zoomScale;
    interactorStyleManipulator.dollyToPosition((1.0 - k), model.zoomPosition, ren, rwi);
    rwi.render();
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
  vtkTrackballZoom.extend(publicAPI, model);

  // Object specific methods
  vtkTrackballZoomToMouse(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
