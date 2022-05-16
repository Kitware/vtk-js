import macro from 'vtk.js/Sources/macros';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';

// ----------------------------------------------------------------------------
// vtkMouseCameraTrackballZoomManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraTrackballZoomManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraTrackballZoomManipulator');

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.previousPosition = position;
    const size = interactor.getView().getViewportSize(renderer);

    const camera = renderer.getActiveCamera();
    const direction = model.flipDirection ? -1 : 1;
    if (camera.getParallelProjection()) {
      model.zoomScale = (1.5 / size[1]) * direction;
    } else {
      const range = camera.getClippingRange();
      model.zoomScale = 1.5 * (range[1] / size[1]) * direction;
    }
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!position) {
      return;
    }

    const dy = model.previousPosition.y - position.y;
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

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }

    model.previousPosition = position;
  };

  publicAPI.onScroll = (interactor, renderer, delta) => {
    if (!delta) {
      return;
    }

    const camera = renderer.getActiveCamera();

    const dyf = 1 - delta / 10;

    if (camera.getParallelProjection()) {
      camera.setParallelScale(camera.getParallelScale() / dyf);
    } else {
      camera.dolly(dyf);
      renderer.resetCameraClippingRange();
    }

    if (interactor.getLightFollowCamera()) {
      renderer.updateLightsGeometryToFollowCamera();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  zoomScale: 0.0,
  flipDirection: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['flipDirection']);

  // Object specific methods
  vtkMouseCameraTrackballZoomManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraTrackballZoomManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
