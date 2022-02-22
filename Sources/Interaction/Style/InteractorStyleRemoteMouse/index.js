import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';

// ----------------------------------------------------------------------------
// Event Types
// ----------------------------------------------------------------------------

const START_INTERACTION_EVENT = { type: 'StartInteractionEvent' };
const INTERACTION_EVENT = { type: 'InteractionEvent' };
const END_INTERACTION_EVENT = { type: 'EndInteractionEvent' };

// ----------------------------------------------------------------------------
// vtkInteractorStyleRemoteMouse methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleRemoteMouse(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleRemoteMouse');

  function createRemoteEvent(callData) {
    // Fields:
    //  - action: [down, up]
    //  - x, y (Normalized)
    // Flags:
    //  - buttonLeft, buttonMiddle, buttonRight
    //  - shiftKey, ctrlKey, altKey, metaKey
    const { buttonLeft, buttonMiddle, buttonRight } = model;
    const shiftKey = callData.shiftKey ? 1 : 0;
    const ctrlKey = callData.controlKey ? 1 : 0;
    const altKey = callData.altKey ? 1 : 0;
    const metaKey = callData.metaKey ? 1 : 0; // Might be platform specific
    const action = buttonLeft || buttonMiddle || buttonRight ? 'down' : 'up';

    // Fixme x / y
    const [width, height] = model._interactor.getView().getSizeByReference();
    let { x, y } = callData.position;
    x /= width;
    y /= height;

    return {
      action,
      x,
      y,
      buttonLeft,
      buttonMiddle,
      buttonRight,
      shiftKey,
      altKey,
      ctrlKey,
      metaKey,
      ...model.remoteEventAddOn,
    };
  }

  //-------------------------------------------------------------------------
  // Mouse
  //-------------------------------------------------------------------------
  publicAPI.handleLeftButtonPress = (callData) => {
    model.previousPosition = callData.position;
    model.buttonLeft = 1;
    publicAPI.onButtonDown(1, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonPress = (callData) => {
    model.previousPosition = callData.position;
    model.buttonMiddle = 1;
    publicAPI.onButtonDown(2, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonPress = (callData) => {
    model.previousPosition = callData.position;
    model.buttonRight = 1;
    publicAPI.onButtonDown(3, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleLeftButtonRelease = (callData) => {
    model.buttonLeft = 0;
    publicAPI.onButtonUp(1, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonRelease = (callData) => {
    model.buttonMiddle = 0;
    publicAPI.onButtonUp(2, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonRelease = (callData) => {
    model.buttonRight = 0;
    publicAPI.onButtonUp(3, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.onButtonDown = (button, callData) => {
    model._interactor.requestAnimation(publicAPI.onButtonDown);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    publicAPI.invokeRemoteMouseEvent(createRemoteEvent(callData));
  };

  //-------------------------------------------------------------------------
  publicAPI.onButtonUp = (button, callData) => {
    publicAPI.invokeRemoteMouseEvent(createRemoteEvent(callData));
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
    model._interactor.cancelAnimation(publicAPI.onButtonDown);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleStartMouseWheel = (callData) => {
    const { spinY, altKey, controlKey, shiftKey } = callData;
    model._interactor.requestAnimation(publicAPI.handleStartMouseWheel);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    publicAPI.invokeRemoteWheelEvent({
      type: 'StartMouseWheel',
      spinY,
      altKey,
      controlKey,
      shiftKey,
      ...model.remoteEventAddOn,
    });
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMouseWheel = (callData) => {
    const { spinY, altKey, controlKey, shiftKey } = callData;
    publicAPI.invokeRemoteWheelEvent({
      type: 'MouseWheel',
      spinY,
      altKey,
      controlKey,
      shiftKey,
      ...model.remoteEventAddOn,
    });
    publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleEndMouseWheel = () => {
    publicAPI.invokeRemoteWheelEvent({
      type: 'EndMouseWheel',
      ...model.remoteEventAddOn,
    });
    model._interactor.cancelAnimation(publicAPI.handleStartMouseWheel);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMouseMove = (callData) => {
    const ts = Date.now();
    const needToSend = model.throttleDelay < ts - model.lastThrottleTime;
    if (
      needToSend &&
      (model.sendMouseMove ||
        model.buttonLeft ||
        model.buttonMiddle ||
        model.buttonRight)
    ) {
      model.lastThrottleTime = ts;
      publicAPI.invokeRemoteMouseEvent(createRemoteEvent(callData));
    }
    publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
  };

  // Override default handler
  publicAPI.handleKeyPress = () => {};

  //-------------------------------------------------------------------------
  // Gesture
  //-------------------------------------------------------------------------

  publicAPI.handleStartPinch = (callData) => {
    publicAPI.startDolly();
    const { scale } = callData;
    model._interactor.requestAnimation(publicAPI.handleStartPinch);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    publicAPI.invokeRemoteGestureEvent({
      type: 'StartPinch',
      scale,
      ...model.remoteEventAddOn,
    });
  };

  //----------------------------------------------------------------------------

  publicAPI.handlePinch = (callData) => {
    const { scale } = callData;
    publicAPI.invokeRemoteGestureEvent({
      type: 'Pinch',
      scale,
      ...model.remoteEventAddOn,
    });
  };

  //--------------------------------------------------------------------------

  publicAPI.handleEndPinch = () => {
    publicAPI.endDolly();
    publicAPI.invokeRemoteGestureEvent({
      type: 'EndPinch',
      ...model.remoteEventAddOn,
    });
    model._interactor.cancelAnimation(publicAPI.handleStartPinch);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };

  //----------------------------------------------------------------------------

  publicAPI.handleStartRotate = (callData) => {
    publicAPI.startRotate();
    const { rotation } = callData;
    model._interactor.requestAnimation(publicAPI.handleStartRotate);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    publicAPI.invokeRemoteGestureEvent({
      type: 'StartRotate',
      rotation,
      ...model.remoteEventAddOn,
    });
  };

  //----------------------------------------------------------------------------

  publicAPI.handleRotate = (callData) => {
    const { rotation } = callData;
    publicAPI.invokeRemoteGestureEvent({
      type: 'Rotate',
      rotation,
      ...model.remoteEventAddOn,
    });
  };

  //--------------------------------------------------------------------------

  publicAPI.handleEndRotate = () => {
    publicAPI.endRotate();
    publicAPI.invokeRemoteGestureEvent({
      type: 'EndRotate',
      ...model.remoteEventAddOn,
    });
    model._interactor.cancelAnimation(publicAPI.handleStartRotate);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };

  //----------------------------------------------------------------------------

  publicAPI.handleStartPan = (callData) => {
    publicAPI.startPan();
    const { translation } = callData;
    model._interactor.requestAnimation(publicAPI.handleStartPan);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    publicAPI.invokeRemoteGestureEvent({
      type: 'StartPan',
      translation,
      ...model.remoteEventAddOn,
    });
  };

  //----------------------------------------------------------------------------

  publicAPI.handlePan = (callData) => {
    const { translation } = callData;
    publicAPI.invokeRemoteGestureEvent({
      type: 'Pan',
      translation,
      ...model.remoteEventAddOn,
    });
  };

  //--------------------------------------------------------------------------

  publicAPI.handleEndPan = () => {
    publicAPI.endPan();
    publicAPI.invokeRemoteGestureEvent({
      type: 'EndPan',
      ...model.remoteEventAddOn,
    });
    model._interactor.cancelAnimation(publicAPI.handleStartPan);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  buttonLeft: 0,
  buttonMiddle: 0,
  buttonRight: 0,
  sendMouseMove: false,
  throttleDelay: 33.3, // 33.3 millisecond <=> 30 events/second
  lastThrottleTime: 0,
  // remoteEventAddOn: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyle.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'sendMouseMove',
    'remoteEventAddOn',
    'throttleDelay',
  ]);
  macro.event(publicAPI, model, 'RemoteMouseEvent');
  macro.event(publicAPI, model, 'RemoteWheelEvent');
  macro.event(publicAPI, model, 'RemoteGestureEvent');

  // Object specific methods
  vtkInteractorStyleRemoteMouse(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractorStyleRemoteMouse'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
