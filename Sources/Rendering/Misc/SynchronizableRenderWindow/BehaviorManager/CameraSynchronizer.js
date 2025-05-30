import * as macro from 'vtk.js/Sources/macros';
import { normalize } from 'vtk.js/Sources/Common/Core/Math';

export const MODE_RESET_CAMERA = 'resetcamera';
export const MODE_ORIENTATION = 'orientation';
export const MODE_SAME = 'same';

export const SynchronizationMode = {
  MODE_RESET_CAMERA,
  MODE_ORIENTATION,
  MODE_SAME,
};

function vtkCameraSynchronizer(publicAPI, model) {
  model.classHierarchy.push('vtkCameraSynchronizer');
  const cameraState = new Float64Array(9);
  const direction = new Float64Array(3);
  const subscriptions = [];

  function updateListeners() {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    if (!model.srcRenderer || !model.dstRenderer) {
      return;
    }

    const srcCamera = model.srcRenderer.getActiveCamera();
    const interactor = model.srcRenderer.getRenderWindow().getInteractor();

    subscriptions.push(
      srcCamera.onModified(() => {
        if (!interactor.isAnimating()) {
          publicAPI.update();
        }
      })
    );
    subscriptions.push(interactor.onAnimation(publicAPI.update));
    subscriptions.push(interactor.onEndAnimation(publicAPI.update));
  }

  // Update listeners automatically
  model._onSrcRendererChanged = updateListeners;
  model._onDstRendererChanged = updateListeners;

  function updatePreviousValues(position, focalPoint, viewUp) {
    if (
      cameraState[0] !== position[0] ||
      cameraState[1] !== position[1] ||
      cameraState[2] !== position[2] ||
      cameraState[3] !== focalPoint[0] ||
      cameraState[4] !== focalPoint[1] ||
      cameraState[5] !== focalPoint[2] ||
      cameraState[6] !== viewUp[0] ||
      cameraState[7] !== viewUp[1] ||
      cameraState[8] !== viewUp[2]
    ) {
      cameraState[0] = position[0];
      cameraState[1] = position[1];
      cameraState[2] = position[2];
      cameraState[3] = focalPoint[0];
      cameraState[4] = focalPoint[1];
      cameraState[5] = focalPoint[2];
      cameraState[6] = viewUp[0];
      cameraState[7] = viewUp[1];
      cameraState[8] = viewUp[2];
      return cameraState;
    }
    return false;
  }

  publicAPI.update = () => {
    if (!model.active || !model.srcRenderer || !model.dstRenderer) {
      return;
    }

    const srcCamera = model.srcRenderer.getActiveCamera();
    const dstCamera = model.dstRenderer.getActiveCamera();
    const position = srcCamera.getReferenceByName('position');
    const focalPoint = srcCamera.getReferenceByName('focalPoint');
    const viewUp = srcCamera.getReferenceByName('viewUp');

    const change = updatePreviousValues(position, focalPoint, viewUp);

    if (!change) {
      return;
    }

    if (model.mode === MODE_ORIENTATION) {
      direction[0] = change[0] - change[3];
      direction[1] = change[1] - change[4];
      direction[2] = change[2] - change[5];
      normalize(direction);
      dstCamera.setPosition(
        model.focalPoint[0] + model.distance * direction[0],
        model.focalPoint[1] + model.distance * direction[1],
        model.focalPoint[2] + model.distance * direction[2]
      );
      dstCamera.setFocalPoint(
        model.focalPoint[0],
        model.focalPoint[1],
        model.focalPoint[2]
      );
      dstCamera.setViewUp(change[6], change[7], change[8]);
    } else {
      dstCamera.setPosition(change[0], change[1], change[2]);
      dstCamera.setFocalPoint(change[3], change[4], change[5]);
      dstCamera.setViewUp(change[6], change[7], change[8]);
    }

    if (model.mode === MODE_RESET_CAMERA) {
      model.dstRenderer.resetCamera();
    }
  };

  publicAPI.delete = macro.chain(
    () => publicAPI.setSrcRenderer(null), // Will clear any listener
    publicAPI.delete
  );

  // If src/dstRenderer provided at constructor register listeners
  updateListeners();
}

export const DEFAULT_VALUES = {
  mode: MODE_ORIENTATION,
  focalPoint: [0, 0, 0],
  distance: 6.8,
  active: true,
  // srcRenderer: null,
  // dstRenderer: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'mode',
    'active',
    'srcRenderer',
    'dstRenderer',
    'distance',
  ]);
  macro.setGetArray(publicAPI, model, ['focalPoint'], 3, 0);

  // Object methods
  vtkCameraSynchronizer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCameraSynchronizer');

export default { newInstance, extend, SynchronizationMode };
