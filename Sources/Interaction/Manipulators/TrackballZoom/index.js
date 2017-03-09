import macro                from 'vtk.js/Sources/macro';
import vtkCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';

// ----------------------------------------------------------------------------
// vtkTrackballZoom methods
// ----------------------------------------------------------------------------

function vtkTrackballZoom(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballZoom');

  publicAPI.onButtonDown = (x, y, ren, rwi) => {
    const size = rwi.getView().getSize();
    const camera = ren.getActiveCamera();

    if (camera.getParallelProjection()) {
      model.zoomScale = 1.5 / size[1];
    } else {
      const range = camera.getClippingRange();
      model.zoomScale = 1.5 * (range[1] / size[1]);
    }
  };

  publicAPI.onAnimation = (x, y, ren, rwi) => {
    const lastPos = rwi.getLastAnimationEventPosition(rwi.getPointerIndex());
    const dy = lastPos.y - y;
    const camera = ren.getActiveCamera();

    // double pos[3], fp[3], *norm, k, tmp;

    if (camera.getParallelProjection()) {
      const k = dy * model.zoomScale;
      camera.setParallelScale((1.0 - k) * camera.getParallelScale());
    } else {
      const pos = camera.getPosition();
      const fp = camera.getFocalPoint();
      const norm = camera.getDirectionOfProjection();
      const k = dy * model.zoomScale;

      let tmp = k * norm[0];
      pos[0] += tmp;
      fp[0] += tmp;

      tmp = k * norm[1];
      pos[1] += tmp;
      fp[1] += tmp;

      tmp = k * norm[2];
      pos[2] += tmp;
      fp[2] += tmp;

      if (!camera.getFreezeFocalPoint()) {
        camera.setFocalPoint(fp[0], fp[1], fp[2]);
      }

      camera.setPosition(pos[0], pos[1], pos[2]);
      ren.resetCameraClippingRange();
    }

    rwi.render();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  zoomScale: 0.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkCameraManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkTrackballZoom(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTrackballZoom');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
