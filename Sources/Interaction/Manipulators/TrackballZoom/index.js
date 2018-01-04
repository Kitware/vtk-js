import macro from 'vtk.js/Sources/macro';
import vtkCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CameraManipulator';

const { vtkWarningMacro } = macro;
const DEFAULT_POSITION = { x: 0, y: 0 };

// ----------------------------------------------------------------------------
// vtkTrackballZoom methods
// ----------------------------------------------------------------------------

function vtkTrackballZoom(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTrackballZoom');

  publicAPI.onButtonDown = (interactor) => {
    const size = interactor.getView().getSize();

    try {
      const { x, y } =
        interactor.getAnimationEventPosition(interactor.getPointerIndex()) ||
        DEFAULT_POSITION;
      const interactorStyle = interactor.getInteractorStyle();
      const renderer =
        interactorStyle.getCurrentRenderer() ||
        interactor.findPokedRenderer(x, y);
      const camera = renderer.getActiveCamera();
      if (camera.getParallelProjection()) {
        model.zoomScale = 1.5 / size[1];
      } else {
        const range = camera.getClippingRange();
        model.zoomScale = 1.5 * (range[1] / size[1]);
      }
    } catch (e) {
      vtkWarningMacro('Unable to set model.zoomScale');
    }
  };

  publicAPI.onAnimation = (interactor, renderer) => {
    const lastPtr = interactor.getPointerIndex();
    const pos = interactor.getAnimationEventPosition(lastPtr);
    const lastPos = interactor.getLastAnimationEventPosition(lastPtr);

    if (!pos || !lastPos || !renderer) {
      return;
    }

    const dy = lastPos.y - pos.y;
    const camera = renderer.getActiveCamera();

    if (camera.getParallelProjection()) {
      const k = dy * model.zoomScale;
      camera.setParallelScale((1.0 - k) * camera.getParallelScale());
    } else {
      const cameraPos = camera.getPosition();
      const cameraFp = camera.getFocalPoint();
      const norm = camera.getDirectionOfProjection();
      const k = dy * model.zoomScale;

      let tmp = k * norm[0];
      cameraPos[0] += tmp;
      cameraFp[0] += tmp;

      tmp = k * norm[1];
      cameraPos[1] += tmp;
      cameraFp[1] += tmp;

      tmp = k * norm[2];
      cameraPos[2] += tmp;
      cameraFp[2] += tmp;

      if (!camera.getFreezeFocalPoint()) {
        camera.setFocalPoint(cameraFp[0], cameraFp[1], cameraFp[2]);
      }

      camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2]);
      renderer.resetCameraClippingRange();
    }
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
