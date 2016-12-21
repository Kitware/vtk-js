import * as macro           from '../../../macro';
import vtkCameraManipulator from '../CameraManipulator';
import vtkTrackballRotate   from '../TrackballRotate';
import vtkTrackballRoll     from '../TrackballRoll';

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

  publicAPI.onButtonDown = (x, y, ren, rwi) => {
    const viewSize = rwi.getView().getSize();
    const viewCenter = [0.5 * viewSize[0], 0.5 * viewSize[1]];
    const rotateRadius = 0.9 * max(viewCenter[0], viewCenter[1]);
    const dist2 = sqr(viewCenter[0] - x) + sqr(viewCenter[1] - y);

    if ((rotateRadius * rotateRadius) > dist2) {
      currentManipulator = rotateManipulator;
    } else {
      currentManipulator = rollManipulator;
    }

    currentManipulator.setButton(publicAPI.getButton());
    currentManipulator.setShift(publicAPI.getShift());
    currentManipulator.setControl(publicAPI.getControl());
    currentManipulator.setCenter(publicAPI.getCenter());

    currentManipulator.onButtonDown(x, y, ren, rwi);
  };

  publicAPI.onButtonUp = (x, y, ren, rwi) => {
    if (currentManipulator) {
      currentManipulator.onButtonUp(x, y, ren, rwi);
    }
  };

  publicAPI.onMouseMove = (x, y, ren, rwi) => {
    if (currentManipulator) {
      currentManipulator.onMouseMove(x, y, ren, rwi);
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

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
