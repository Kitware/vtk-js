import macro              from 'vtk.js/Sources/macro';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';
import vtkMath            from 'vtk.js/Sources/Common/Core/Math';
import { States }         from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';

/* eslint-disable no-lonely-if */

// ----------------------------------------------------------------------------
// vtkInteractorStyleTrackballCamera methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleTrackballCamera(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleTrackballCamera');

  // Public API methods
  publicAPI.handleMouseMove = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());

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
      } else {
        publicAPI.startPan();
      }
    } else {
      if (model.interactor.getControlKey() || model.interactor.getAltKey()) {
        publicAPI.startSpin();
      } else {
        publicAPI.startRotate();
      }
    }
  };

  //--------------------------------------------------------------------------
  publicAPI.handleLeftButtonRelease = () => {
    switch (model.state) {
      case States.IS_DOLLY:
        publicAPI.endDolly();
        break;

      case States.IS_PAN:
        publicAPI.endPan();
        break;

      case States.IS_SPIN:
        publicAPI.endSpin();
        break;

      case States.IS_ROTATE:
        publicAPI.endRotate();
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
    model.interactor.render();
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
    model.interactor.render();
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
    model.interactor.render();
  };


  //--------------------------------------------------------------------------
  publicAPI.rotate = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getEventPosition(lastPtr);
    const lastPos = model.interactor.getLastEventPosition(lastPtr);

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
    if (!isNaN(rxf) && !isNaN(ryf)) {
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

    rwi.render();
  };

  //--------------------------------------------------------------------------
  publicAPI.spin = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getEventPosition(lastPtr);
    const lastPos = model.interactor.getLastEventPosition(lastPtr);

    const camera = model.currentRenderer.getActiveCamera();
    const center = rwi.getView().getViewportCenter(model.currentRenderer);

    const oldAngle =
      vtkMath.degreesFromRadians(Math.atan2(lastPos.y - center[1],
                                          lastPos.x - center[0]));
    const newAngle =
      vtkMath.degreesFromRadians(Math.atan2(pos.y - center[1],
                                          pos.x - center[0])) - oldAngle;

    if (!isNaN(newAngle)) {
      camera.roll(newAngle);
      camera.orthogonalizeViewUp();
    }

    rwi.render();
  };

  publicAPI.pan = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const rwi = model.interactor;

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getEventPosition(lastPtr);
    const lastPos = model.interactor.getLastEventPosition(lastPtr);

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

    rwi.render();
  };

  //----------------------------------------------------------------------------
  publicAPI.dolly = () => {
    if (model.currentRenderer === null) {
      return;
    }

    const lastPtr = model.interactor.getPointerIndex();
    const pos = model.interactor.getEventPosition(lastPtr);
    const lastPos = model.interactor.getLastEventPosition(lastPtr);

    const dy = pos.y - lastPos.y;
    const rwi = model.interactor;
    const center = rwi.getView().getViewportCenter(model.currentRenderer);
    const dyf = model.motionFactor * dy / center[1];

    publicAPI.dollyByFactor(Math.pow(1.1, dyf));
  };

  //----------------------------------------------------------------------------
  publicAPI.dollyByFactor = (factor) => {
    if (model.currentRenderer === null || isNaN(factor)) {
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

    rwi.render();
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
