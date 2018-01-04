import macro              from 'vtk.js/Sources/macro';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';
import vtkMath            from 'vtk.js/Sources/Common/Core/Math';
import { Device, Input }  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';

const { States } = vtkInteractorStyle;

/* eslint-disable no-lonely-if */

// ----------------------------------------------------------------------------
// vtkInteractorStyleTrackballCamera methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleTrackballCamera(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleTrackballCamera');

  // Public API methods
  publicAPI.handleAnimation = () => {
    const pos = model.interactor.getAnimationEventPosition(model.interactor.getPointerIndex());

    switch (model.state) {
      case States.IS_ROTATE:
        publicAPI.findPokedRenderer(pos.x, pos.y);
        publicAPI.rotate();
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      case States.IS_PAN:
        publicAPI.findPokedRenderer(pos.x, pos.y);
        publicAPI.pan();
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      case States.IS_DOLLY:
        publicAPI.findPokedRenderer(pos.x, pos.y);
        publicAPI.dolly();
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      case States.IS_SPIN:
        publicAPI.findPokedRenderer(pos.x, pos.y);
        publicAPI.spin();
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;

      default:
        break;
    }
  };

  publicAPI.handleButton3D = (arg) => {
    const ed = arg.calldata;
    publicAPI.findPokedRenderer(0, 0);
    if (model.currentRenderer === null) {
      return;
    }

    if (ed && ed.pressed &&
        ed.device === Device.RightController &&
        ed.input === Input.TrackPad) {
      publicAPI.startCameraPose();
      publicAPI.setAnimationStateOn();
      return;
    }
    if (ed && !ed.pressed &&
        ed.device === Device.RightController &&
        ed.input === Input.TrackPad &&
        model.state === States.IS_CAMERA_POSE) {
      publicAPI.endCameraPose();
      publicAPI.setAnimationStateOff();
      // return;
    }
  };

  publicAPI.handleMove3D = (arg) => {
    const ed = arg.calldata;
    switch (model.state) {
      case States.IS_CAMERA_POSE:
        publicAPI.updateCameraPose(ed);
        break;
      default:
    }
  };

  publicAPI.updateCameraPose = (ed) => {
    // move the world in the direction of the
    // controller
    const camera = model.currentRenderer.getActiveCamera();
    const oldTrans = camera.getPhysicalTranslation();

    // look at the y axis to determine how fast / what direction to move
    const speed = ed.gamepad.axes[1];

    // 0.05 meters / frame movement
    const pscale = speed * 0.05 / camera.getPhysicalScale();

    // convert orientation to world coordinate direction
    const dir = camera.physicalOrientationToWorldDirection(ed.orientation);

    camera.setPhysicalTranslation(
      oldTrans[0] + (dir[0] * pscale),
      oldTrans[1] + (dir[1] * pscale),
      oldTrans[2] + (dir[2] * pscale));
  };

  //----------------------------------------------------------------------------
  publicAPI.handleLeftButtonPress = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    publicAPI.findPokedRenderer(pos.x, pos.y);
    if (model.currentRenderer === null) {
      return;
    }

    publicAPI.grabFocus(model.eventCallbackCommand);
    if (model.interactor.getShiftKey()) {
      if (model.interactor.getControlKey() || model.interactor.getAltKey()) {
        publicAPI.startDolly();
        publicAPI.setAnimationStateOn();
      } else {
        publicAPI.startPan();
        publicAPI.setAnimationStateOn();
      }
    } else {
      if (model.interactor.getControlKey() || model.interactor.getAltKey()) {
        publicAPI.startSpin();
        publicAPI.setAnimationStateOn();
      } else {
        publicAPI.startRotate();
        publicAPI.setAnimationStateOn();
      }
    }
  };

  //--------------------------------------------------------------------------
  publicAPI.handleLeftButtonRelease = () => {
    switch (model.state) {
      case States.IS_DOLLY:
        publicAPI.endDolly();
        publicAPI.setAnimationStateOff();
        break;

      case States.IS_PAN:
        publicAPI.endPan();
        publicAPI.setAnimationStateOff();
        break;

      case States.IS_SPIN:
        publicAPI.endSpin();
        publicAPI.setAnimationStateOff();
        break;

      case States.IS_ROTATE:
        publicAPI.endRotate();
        publicAPI.setAnimationStateOff();
        break;

      default:
        break;
    }

    if (model.interactor) {
      publicAPI.releaseFocus();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.handlePinch = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    publicAPI.findPokedRenderer(pos.x, pos.y);
    if (model.currentRenderer === null) {
      return;
    }

    const camera = model.currentRenderer.getActiveCamera();

    const dyf = model.interactor.getScale() / model.interactor.getLastScale();
    if (camera.getParallelProjection()) {
      camera.setParallelScale(camera.getParallelScale() / dyf);
    } else {
      camera.dolly(dyf);
      if (model.autoAdjustCameraClippingRange) {
        model.currentRenderer.resetCameraClippingRange();
      }
    }

    if (model.interactor.getLightFollowCamera()) {
      model.currentRenderer.updateLightsGeometryToFollowCamera();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.handlePan = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    publicAPI.findPokedRenderer(pos.x, pos.y);
    if (model.currentRenderer === null) {
      return;
    }

    const camera = model.currentRenderer.getActiveCamera();

    const rwi = model.interactor;

    // Calculate the focal depth since we'll be using it a lot
    let viewFocus = camera.getFocalPoint();

    viewFocus = publicAPI.computeWorldToDisplay(viewFocus[0], viewFocus[1], viewFocus[2]);
    const focalDepth = viewFocus[2];

    let newPickPoint = publicAPI.computeDisplayToWorld(pos.x, pos.y,
                                focalDepth);

    const trans = rwi.getTranslation();
    const lastTrans = rwi.getLastTranslation();
    newPickPoint = publicAPI.computeDisplayToWorld(viewFocus[0] + trans[0] - lastTrans[0],
                                viewFocus[1] + trans[1] - lastTrans[1],
                                focalDepth);

    // Has to recalc old mouse point since the viewport has moved,
    // so can't move it outside the loop
    const oldPickPoint = publicAPI.computeDisplayToWorld(viewFocus[0],
                                viewFocus[1],
                                focalDepth);

    // Camera motion is reversed
    const motionVector = [];
    motionVector[0] = oldPickPoint[0] - newPickPoint[0];
    motionVector[1] = oldPickPoint[1] - newPickPoint[1];
    motionVector[2] = oldPickPoint[2] - newPickPoint[2];

    viewFocus = camera.getFocalPoint();
    const viewPoint = camera.getPosition();
    camera.setFocalPoint(motionVector[0] + viewFocus[0],
                          motionVector[1] + viewFocus[1],
                          motionVector[2] + viewFocus[2]);

    camera.setPosition(motionVector[0] + viewPoint[0],
                        motionVector[1] + viewPoint[1],
                        motionVector[2] + viewPoint[2]);

    if (model.interactor.getLightFollowCamera()) {
      model.currentRenderer.updateLightsGeometryToFollowCamera();
    }

    camera.orthogonalizeViewUp();
  };

  publicAPI.handleRotate = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    publicAPI.findPokedRenderer(pos.x, pos.y);
    if (model.currentRenderer === null) {
      return;
    }

    const camera = model.currentRenderer.getActiveCamera();


    camera.roll(model.interactor.getRotation() - model.interactor.getLastRotation());

    camera.orthogonalizeViewUp();
  };


  //--------------------------------------------------------------------------
  publicAPI.rotate = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getAnimationEventPosition(lastPtr);
    const lastPos = model.interactor.getLastAnimationEventPosition(lastPtr);

    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;

    const size = rwi.getView().getViewportSize(model.currentRenderer);

    let deltaElevation = -0.1;
    let deltaAzimuth = -0.1;
    if (size[0] && size[1]) {
      deltaElevation = -20.0 / size[1];
      deltaAzimuth = -20.0 / size[0];
    }

    const rxf = dx * deltaAzimuth * model.motionFactor;
    const ryf = dy * deltaElevation * model.motionFactor;

    const camera = model.currentRenderer.getActiveCamera();
    if (!Number.isNaN(rxf) && !Number.isNaN(ryf)) {
      camera.azimuth(rxf);
      camera.elevation(ryf);
      camera.orthogonalizeViewUp();
    }

    if (model.autoAdjustCameraClippingRange) {
      model.currentRenderer.resetCameraClippingRange();
    }

    if (rwi.getLightFollowCamera()) {
      model.currentRenderer.updateLightsGeometryToFollowCamera();
    }
  };

  //--------------------------------------------------------------------------
  publicAPI.spin = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getAnimationEventPosition(lastPtr);
    const lastPos = model.interactor.getLastAnimationEventPosition(lastPtr);

    const camera = model.currentRenderer.getActiveCamera();
    const center = rwi.getView().getViewportCenter(model.currentRenderer);

    const oldAngle =
      vtkMath.degreesFromRadians(Math.atan2(lastPos.y - center[1],
                                          lastPos.x - center[0]));
    const newAngle =
      vtkMath.degreesFromRadians(Math.atan2(pos.y - center[1],
                                          pos.x - center[0])) - oldAngle;

    if (!Number.isNaN(newAngle)) {
      camera.roll(newAngle);
      camera.orthogonalizeViewUp();
    }
  };

  publicAPI.pan = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getAnimationEventPosition(lastPtr);
    const lastPos = model.interactor.getLastAnimationEventPosition(lastPtr);

    const camera = model.currentRenderer.getActiveCamera();

    // Calculate the focal depth since we'll be using it a lot
    let viewFocus = camera.getFocalPoint();
    viewFocus = publicAPI.computeWorldToDisplay(viewFocus[0], viewFocus[1], viewFocus[2]);
    const focalDepth = viewFocus[2];

    const newPickPoint = publicAPI.computeDisplayToWorld(pos.x, pos.y,
                                focalDepth);

    // Has to recalc old mouse point since the viewport has moved,
    // so can't move it outside the loop
    const oldPickPoint = publicAPI.computeDisplayToWorld(lastPos.x,
                                lastPos.y,
                                focalDepth);

    // Camera motion is reversed
    const motionVector = [];
    motionVector[0] = oldPickPoint[0] - newPickPoint[0];
    motionVector[1] = oldPickPoint[1] - newPickPoint[1];
    motionVector[2] = oldPickPoint[2] - newPickPoint[2];

    viewFocus = camera.getFocalPoint();
    const viewPoint = camera.getPosition();
    camera.setFocalPoint(motionVector[0] + viewFocus[0],
                          motionVector[1] + viewFocus[1],
                          motionVector[2] + viewFocus[2]);

    camera.setPosition(motionVector[0] + viewPoint[0],
                        motionVector[1] + viewPoint[1],
                        motionVector[2] + viewPoint[2]);

    if (rwi.getLightFollowCamera()) {
      model.currentRenderer.updateLightsGeometryToFollowCamera();
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.dolly = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getAnimationEventPosition(lastPtr);
    const lastPos = model.interactor.getLastAnimationEventPosition(lastPtr);

    const dy = pos.y - lastPos.y;
    const rwi = model.interactor;
    const center = rwi.getView().getViewportCenter(model.currentRenderer);
    const dyf = model.motionFactor * dy / center[1];

    publicAPI.dollyByFactor(Math.pow(1.1, dyf));
  };

  //----------------------------------------------------------------------------
  publicAPI.dollyByFactor = (factor) => {
    if (model.currentRenderer === null || Number.isNaN(factor)) {
      return;
    }

    const rwi = model.interactor;

    const camera = model.currentRenderer.getActiveCamera();
    if (camera.getParallelProjection()) {
      camera.setParallelScale(camera.getParallelScale() / factor);
    } else {
      camera.dolly(factor);
      if (model.autoAdjustCameraClippingRange) {
        model.currentRenderer.resetCameraClippingRange();
      }
    }

    if (rwi.getLightFollowCamera()) {
      model.currentRenderer.updateLightsGeometryToFollowCamera();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  motionFactor: 10.0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyle.extend(publicAPI, model, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['motionFactor']);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkInteractorStyleTrackballCamera(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorStyleTrackballCamera');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
