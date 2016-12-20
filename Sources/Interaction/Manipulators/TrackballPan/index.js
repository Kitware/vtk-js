import * as macro from '../../../macro';
import vtkCameraManipulator from '../CameraManipulator';
import vtkMath from './../../../Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkTrackballPan methods
// ----------------------------------------------------------------------------

function vtkTrackballPan(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballPan');

  publicAPI.onMouseMove = (x, y, ren, rwi) => {
    const camera = ren.getActiveCamera();

    const lastPos = rwi.getLastEventPosition(rwi.getPointerIndex());

    const camPos = camera.getPosition();
    const fp = camera.getFocalPoint();

    if (camera.getParallelProjection()) {
      camera.orthogonalizeViewUp();

      const up = camera.getViewUp();
      const vpn = camera.getViewPlaneNormal();

      const right = [0, 0, 0];

      vtkMath.cross(vpn, up, right);

      // These are different because y is flipped.
      const size = rwi.getView().getSize();
      let dx = (x - lastPos.x) / size[1];
      let dy = (lastPos.y - y) / size[1];

      const scale = camera.getParallelScale();
      dx *= scale * 2.0;
      dy *= scale * 2.0;

      let tmp = (right[0] * dx) + (up[0] * dy);
      camPos[0] += tmp;
      fp[0] += tmp;
      tmp = (right[1] * dx) + (up[1] * dy);
      camPos[1] += tmp;
      fp[1] += tmp;
      tmp = (right[2] * dx) + (up[2] * dy);
      camPos[2] += tmp;
      fp[2] += tmp;
      camera.setPosition(camPos);
      camera.setFocalPoint(fp);
    } else {
      const center = model.center;
      const focalDepth = rwi.getInteractorStyle().computeWorldToDisplay(center[0], center[1], center[2])[2];

      const worldPoint = rwi.getInteractorStyle().computeDisplayToWorld(x, y, focalDepth);
      const lastWorldPoint = rwi.getInteractorStyle().computeDisplayToWorld(lastPos.x, lastPos.y, focalDepth);

      const newCamPos = [
        camPos[0] + (lastWorldPoint[0] - worldPoint[0]),
        camPos[1] + (lastWorldPoint[1] - worldPoint[1]),
        camPos[2] + (lastWorldPoint[2] - worldPoint[2]),
      ];

      const newFp = [
        fp[0] + (lastWorldPoint[0] - worldPoint[0]),
        fp[1] + (lastWorldPoint[1] - worldPoint[1]),
        fp[2] + (lastWorldPoint[2] - worldPoint[2]),
      ];

      camera.setPosition(newCamPos[0], newCamPos[1], newCamPos[2]);
      camera.setFocalPoint(newFp[0], newFp[1], newFp[2]);
    }

    ren.resetCameraClippingRange();
    rwi.render();
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
  vtkCameraManipulator.extend(publicAPI, model);

  // Object specific methods
  vtkTrackballPan(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
