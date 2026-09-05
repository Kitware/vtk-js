import { quat } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';
import vtkInteractorStyleConstants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { States } = vtkInteractorStyleConstants;
const IS_USCALE = 5;

function applyWorldRotation(prop, degrees, axis) {
  if (!degrees || !axis) {
    return;
  }

  const normalizedAxis = [...axis];
  if (vtkMath.normalize(normalizedAxis) === 0.0) {
    return;
  }

  const currentOrientation = prop.getOrientationQuaternion(new Float64Array(4));
  const rotationDelta = quat.setAxisAngle(
    quat.create(),
    normalizedAxis,
    vtkMath.radiansFromDegrees(degrees)
  );

  quat.multiply(currentOrientation, rotationDelta, currentOrientation);
  quat.normalize(currentOrientation, currentOrientation);
  prop.setOrientationFromQuaternion(currentOrientation);
}

function vtkInteractorStyleTrackballActor(publicAPI, model) {
  model.classHierarchy.push('vtkInteractorStyleTrackballActor');

  macro.event(publicAPI, model, 'StartUniformScaleEvent');
  macro.event(publicAPI, model, 'EndUniformScaleEvent');

  publicAPI.startUniformScale = () => {
    if (model.state !== States.IS_NONE) {
      return;
    }
    model.state = IS_USCALE;
    model._interactor.requestAnimation(publicAPI);
    publicAPI.invokeStartInteractionEvent({ type: 'StartInteractionEvent' });
    publicAPI.invokeStartUniformScaleEvent({ type: 'StartUniformScaleEvent' });
  };

  publicAPI.endUniformScale = () => {
    if (model.state !== IS_USCALE) {
      return;
    }
    model.state = States.IS_NONE;
    model._interactor.cancelAnimation(publicAPI);
    publicAPI.invokeEndInteractionEvent({ type: 'EndInteractionEvent' });
    publicAPI.invokeEndUniformScaleEvent({ type: 'EndUniformScaleEvent' });
    model._interactor.render();
  };

  publicAPI.findPickedActor = (renderer, position) => {
    model.currentRenderer = renderer;
    model.interactionPicker.pick([position.x, position.y, 0.0], renderer);
    model.interactionProp = model.interactionPicker.getActors()[0] ?? null;
  };

  publicAPI.handleMouseMove = (callData) => {
    const pos = callData.position;
    const renderer = model.getRenderer(callData);

    switch (model.state) {
      case States.IS_ROTATE:
        publicAPI.handleMouseRotate(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case States.IS_PAN:
        publicAPI.handleMousePan(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case States.IS_DOLLY:
        publicAPI.handleMouseDolly(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case States.IS_SPIN:
        publicAPI.handleMouseSpin(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case IS_USCALE:
        publicAPI.handleMouseUniformScale(renderer, pos);
        publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      default:
        break;
    }

    model.previousPosition = pos;
  };

  publicAPI.handleLeftButtonPress = (callData) => {
    const renderer = model.getRenderer(callData);
    const pos = callData.position;
    model.previousPosition = pos;
    publicAPI.findPickedActor(renderer, pos);
    if (!renderer || !model.interactionProp) {
      return;
    }
    if (callData.shiftKey) {
      publicAPI.startPan();
    } else if (callData.controlKey || callData.altKey) {
      publicAPI.startSpin();
    } else {
      publicAPI.startRotate();
    }
  };

  publicAPI.handleLeftButtonRelease = () => {
    switch (model.state) {
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
    model.interactionProp = null;
  };

  publicAPI.handleMiddleButtonPress = (callData) => {
    const renderer = model.getRenderer(callData);
    const pos = callData.position;
    model.previousPosition = pos;
    publicAPI.findPickedActor(renderer, pos);
    if (!renderer || !model.interactionProp) {
      return;
    }
    if (callData.controlKey || callData.altKey) {
      publicAPI.startDolly();
    } else {
      publicAPI.startPan();
    }
  };

  publicAPI.handleMiddleButtonRelease = () => {
    switch (model.state) {
      case States.IS_DOLLY:
        publicAPI.endDolly();
        break;
      case States.IS_PAN:
        publicAPI.endPan();
        break;
      default:
        break;
    }
    model.interactionProp = null;
  };

  publicAPI.handleRightButtonPress = (callData) => {
    const renderer = model.getRenderer(callData);
    const pos = callData.position;
    model.previousPosition = pos;
    publicAPI.findPickedActor(renderer, pos);
    if (!renderer || !model.interactionProp) {
      return;
    }
    publicAPI.startUniformScale();
  };

  publicAPI.handleRightButtonRelease = () => {
    if (model.state === IS_USCALE) {
      publicAPI.endUniformScale();
    }
    model.interactionProp = null;
  };

  publicAPI.applyTransform = (renderer) => {
    if (model.autoAdjustCameraClippingRange) {
      renderer.resetCameraClippingRange();
    }
    model._interactor.render();
  };

  publicAPI.handleMouseRotate = (renderer, position) => {
    if (!model.previousPosition || !model.interactionProp) {
      return;
    }

    const dx = position.x - model.previousPosition.x;
    const dy = position.y - model.previousPosition.y;
    const size = model._interactor.getView().getViewportSize(renderer);
    const deltaElevation = -20.0 / (size[1] || 1);
    const deltaAzimuth = -20.0 / (size[0] || 1);

    const camera = renderer.getActiveCamera();
    const center = model.interactionProp.getCenter();
    camera.orthogonalizeViewUp();

    const viewUp = camera.getViewUp();
    vtkMath.normalize(viewUp);
    const viewLook = camera.getViewPlaneNormal();
    const viewRight = [];
    vtkMath.cross(viewUp, viewLook, viewRight);
    vtkMath.normalize(viewRight);

    const xAngle = -dx * deltaAzimuth * model.motionFactor;
    const yAngle = dy * deltaElevation * model.motionFactor;

    model.interactionProp.setOrigin(...center);
    applyWorldRotation(model.interactionProp, xAngle, viewUp);
    applyWorldRotation(model.interactionProp, yAngle, viewRight);
    publicAPI.applyTransform(renderer);
  };

  publicAPI.handleMouseSpin = (renderer, position) => {
    if (!model.previousPosition || !model.interactionProp) {
      return;
    }

    const camera = renderer.getActiveCamera();
    const center = model.interactionProp.getCenter();
    let motionVector = null;

    if (camera.getParallelProjection()) {
      motionVector = [...camera.getViewPlaneNormal()];
    } else {
      const viewPoint = camera.getPosition();
      motionVector = [
        viewPoint[0] - center[0],
        viewPoint[1] - center[1],
        viewPoint[2] - center[2],
      ];
      vtkMath.normalize(motionVector);
    }

    const displayCenter = publicAPI.computeWorldToDisplay(
      renderer,
      center[0],
      center[1],
      center[2]
    );

    const newAngle = vtkMath.degreesFromRadians(
      Math.atan2(position.y - displayCenter[1], position.x - displayCenter[0])
    );
    const oldAngle = vtkMath.degreesFromRadians(
      Math.atan2(
        model.previousPosition.y - displayCenter[1],
        model.previousPosition.x - displayCenter[0]
      )
    );

    model.interactionProp.setOrigin(...center);
    applyWorldRotation(
      model.interactionProp,
      newAngle - oldAngle,
      motionVector
    );
    publicAPI.applyTransform(renderer);
  };

  publicAPI.handleMousePan = (renderer, position) => {
    if (!model.previousPosition || !model.interactionProp) {
      return;
    }

    const center = model.interactionProp.getCenter();
    const displayCenter = publicAPI.computeWorldToDisplay(
      renderer,
      center[0],
      center[1],
      center[2]
    );
    const focalDepth = displayCenter[2];

    const newPickPoint = publicAPI.computeDisplayToWorld(
      renderer,
      position.x,
      position.y,
      focalDepth
    );
    const oldPickPoint = publicAPI.computeDisplayToWorld(
      renderer,
      model.previousPosition.x,
      model.previousPosition.y,
      focalDepth
    );
    const motionVector = [
      newPickPoint[0] - oldPickPoint[0],
      newPickPoint[1] - oldPickPoint[1],
      newPickPoint[2] - oldPickPoint[2],
    ];

    model.interactionProp.addPosition(motionVector);
    publicAPI.applyTransform(renderer);
  };

  publicAPI.handleMouseDolly = (renderer, position) => {
    if (!model.previousPosition || !model.interactionProp) {
      return;
    }

    const camera = renderer.getActiveCamera();
    const viewPoint = camera.getPosition();
    const viewFocus = camera.getFocalPoint();
    const center = model._interactor.getView().getViewportCenter(renderer);
    const dy = position.y - model.previousPosition.y;
    const yf = (dy / center[1]) * model.motionFactor;
    const dollyFactor = 1.1 ** yf - 1.0;
    const motionVector = [
      (viewPoint[0] - viewFocus[0]) * dollyFactor,
      (viewPoint[1] - viewFocus[1]) * dollyFactor,
      (viewPoint[2] - viewFocus[2]) * dollyFactor,
    ];

    model.interactionProp.addPosition(motionVector);
    publicAPI.applyTransform(renderer);
  };

  publicAPI.handleMouseUniformScale = (renderer, position) => {
    if (!model.previousPosition || !model.interactionProp) {
      return;
    }

    const center = model._interactor.getView().getViewportCenter(renderer);
    const dy = position.y - model.previousPosition.y;
    const yf = (dy / center[1]) * model.motionFactor;
    const scaleFactor = 1.1 ** yf;
    const currentScale = model.interactionProp.getScale();
    model.interactionProp.setOrigin(...model.interactionProp.getCenter());
    model.interactionProp.setScale(
      currentScale[0] * scaleFactor,
      currentScale[1] * scaleFactor,
      currentScale[2] * scaleFactor
    );
    publicAPI.applyTransform(renderer);
  };
}

const DEFAULT_VALUES = {
  motionFactor: 10.0,
  interactionProp: null,
  interactionPicker: null,
  currentRenderer: null,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkInteractorStyle.extend(publicAPI, model, initialValues);

  if (!model.interactionPicker) {
    model.interactionPicker = vtkCellPicker.newInstance({ tolerance: 0.001 });
  }

  macro.setGet(publicAPI, model, ['motionFactor', 'interactionProp']);
  macro.get(publicAPI, model, ['interactionPicker']);

  vtkInteractorStyleTrackballActor(publicAPI, model);
}

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractorStyleTrackballActor'
);

export default { newInstance, extend };
