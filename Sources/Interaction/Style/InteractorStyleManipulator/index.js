import macro from 'vtk.js/Sources/macros';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';

const { vtkDebugMacro } = macro;
const { States } = vtkInteractorStyle;

// ----------------------------------------------------------------------------
// Event Types
// ----------------------------------------------------------------------------

const START_INTERACTION_EVENT = { type: 'StartInteractionEvent' };
const INTERACTION_EVENT = { type: 'InteractionEvent' };
const END_INTERACTION_EVENT = { type: 'EndInteractionEvent' };

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function translateCamera(renderer, rwi, toX, toY, fromX, fromY) {
  const cam = renderer.getActiveCamera();
  let viewFocus = cam.getFocalPoint();

  viewFocus = rwi
    .getInteractorStyle()
    .computeWorldToDisplay(renderer, viewFocus[0], viewFocus[1], viewFocus[2]);
  const focalDepth = viewFocus[2];

  const newPickPoint = rwi
    .getInteractorStyle()
    .computeDisplayToWorld(renderer, toX, toY, focalDepth);
  const oldPickPoint = rwi
    .getInteractorStyle()
    .computeDisplayToWorld(renderer, fromX, fromY, focalDepth);

  // camera motion is reversed
  const motionVector = [
    oldPickPoint[0] - newPickPoint[0],
    oldPickPoint[1] - newPickPoint[1],
    oldPickPoint[2] - newPickPoint[2],
  ];

  viewFocus = cam.getFocalPoint();
  const viewPoint = cam.getPosition();

  cam.setFocalPoint(
    motionVector[0] + viewFocus[0],
    motionVector[1] + viewFocus[1],
    motionVector[2] + viewFocus[2]
  );
  cam.setPosition(
    motionVector[0] + viewPoint[0],
    motionVector[1] + viewPoint[1],
    motionVector[2] + viewPoint[2]
  );
}

function dollyToPosition(fact, position, renderer, rwi) {
  const cam = renderer.getActiveCamera();

  if (cam.getParallelProjection()) {
    // Zoom relatively to the cursor
    const view = rwi.getView();
    const aSize = view.getViewportSize(renderer);
    const viewport = renderer.getViewport();
    const viewSize = view.getSize();
    const w = aSize[0];
    const h = aSize[1];
    const x0 = w / 2;
    const y0 = h / 2;
    const x1 = position.x - viewport[0] * viewSize[0];
    const y1 = position.y - viewport[1] * viewSize[1];
    translateCamera(renderer, rwi, x0, y0, x1, y1);
    cam.setParallelScale(cam.getParallelScale() / fact);
    translateCamera(renderer, rwi, x1, y1, x0, y0);
  } else {
    // Zoom relatively to the cursor position

    // Move focal point to cursor position
    let viewFocus = cam.getFocalPoint();
    const norm = cam.getViewPlaneNormal();

    viewFocus = rwi
      .getInteractorStyle()
      .computeWorldToDisplay(
        renderer,
        viewFocus[0],
        viewFocus[1],
        viewFocus[2]
      );
    const newFp = rwi
      .getInteractorStyle()
      .computeDisplayToWorld(renderer, position.x, position.y, viewFocus[2]);

    cam.setFocalPoint(newFp[0], newFp[1], newFp[2]);

    // Move camera in/out along projection direction
    cam.dolly(fact);
    renderer.resetCameraClippingRange();

    // Find new focal point
    const newCameraPos = cam.getPosition();
    viewFocus = cam.getFocalPoint();
    const newPoint = [0, 0, 0];
    let t =
      norm[0] * (viewFocus[0] - newCameraPos[0]) +
      norm[1] * (viewFocus[1] - newCameraPos[1]) +
      norm[2] * (viewFocus[2] - newCameraPos[2]);
    t /= norm[0] ** 2 + norm[1] ** 2 + norm[2] ** 2;
    newPoint[0] = newCameraPos[0] + norm[0] * t;
    newPoint[1] = newCameraPos[1] + norm[1] * t;
    newPoint[2] = newCameraPos[2] + norm[2] * t;

    cam.setFocalPoint(newPoint[0], newPoint[1], newPoint[2]);
    renderer.resetCameraClippingRange();
  }
}

function dollyByFactor(interactor, renderer, factor) {
  if (Number.isNaN(factor)) {
    return;
  }

  const camera = renderer.getActiveCamera();
  if (camera.getParallelProjection()) {
    camera.setParallelScale(camera.getParallelScale() / factor);
  } else {
    camera.dolly(factor);
    renderer.resetCameraClippingRange();
  }

  if (interactor.getLightFollowCamera()) {
    renderer.updateLightsGeometryToFollowCamera();
  }
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  dollyToPosition,
  translateCamera,
  dollyByFactor,
};

// ----------------------------------------------------------------------------
// vtkInteractorStyleManipulator methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleManipulator');

  model.mouseManipulators = [];
  model.keyboardManipulators = [];
  model.vrManipulators = [];
  model.gestureManipulators = [];
  model.currentManipulator = null;
  model.currentWheelManipulator = null;
  model.centerOfRotation = [0, 0, 0];
  model.rotationFactor = 1;

  //-------------------------------------------------------------------------
  publicAPI.removeAllManipulators = () => {
    publicAPI.removeAllMouseManipulators();
    publicAPI.removeAllKeyboardManipulators();
    publicAPI.removeAllVRManipulators();
    publicAPI.removeAllGestureManipulators();
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAllMouseManipulators = () => {
    model.mouseManipulators = [];
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAllKeyboardManipulators = () => {
    model.keyboardManipulators = [];
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAllVRManipulators = () => {
    model.vrManipulators = [];
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAllGestureManipulators = () => {
    model.gestureManipulators = [];
  };

  //-------------------------------------------------------------------------
  const removeManipulator = (manipulator, list) => {
    const index = list.indexOf(manipulator);
    if (index === -1) {
      return false;
    }
    list.splice(index, 1);
    publicAPI.modified();
    return true;
  };

  //-------------------------------------------------------------------------
  publicAPI.removeMouseManipulator = (manipulator) =>
    removeManipulator(manipulator, model.mouseManipulators);

  //-------------------------------------------------------------------------
  publicAPI.removeKeyboardManipulator = (manipulator) =>
    removeManipulator(manipulator, model.keyboardManipulators);

  //-------------------------------------------------------------------------
  publicAPI.removeVRManipulator = (manipulator) =>
    removeManipulator(manipulator, model.vrManipulators);

  //-------------------------------------------------------------------------
  publicAPI.removeGestureManipulator = (manipulator) =>
    removeManipulator(manipulator, model.gestureManipulators);

  //-------------------------------------------------------------------------
  const addManipulator = (manipulator, list) => {
    const index = list.indexOf(manipulator);
    if (index !== -1) {
      return false;
    }
    list.push(manipulator);
    publicAPI.modified();
    return true;
  };

  //-------------------------------------------------------------------------
  publicAPI.addMouseManipulator = (manipulator) =>
    addManipulator(manipulator, model.mouseManipulators);

  //-------------------------------------------------------------------------
  publicAPI.addKeyboardManipulator = (manipulator) =>
    addManipulator(manipulator, model.keyboardManipulators);

  //-------------------------------------------------------------------------
  publicAPI.addVRManipulator = (manipulator) =>
    addManipulator(manipulator, model.vrManipulators);

  //-------------------------------------------------------------------------
  publicAPI.addGestureManipulator = (manipulator) =>
    addManipulator(manipulator, model.gestureManipulators);

  //-------------------------------------------------------------------------
  publicAPI.getNumberOfMouseManipulators = () => model.mouseManipulators.length;

  //-------------------------------------------------------------------------
  publicAPI.getNumberOfKeyboardManipulators = () =>
    model.keyboardManipulators.length;

  //-------------------------------------------------------------------------
  publicAPI.getNumberOfVRManipulators = () => model.vrManipulators.length;

  //-------------------------------------------------------------------------
  publicAPI.getNumberOfGestureManipulators = () =>
    model.gestureManipulators.length;

  //-------------------------------------------------------------------------
  publicAPI.resetCurrentManipulator = () => {
    model.currentManipulator = null;
    model.currentWheelManipulator = null;
  };

  //-------------------------------------------------------------------------
  // Mouse
  //-------------------------------------------------------------------------
  publicAPI.handleLeftButtonPress = (callData) => {
    model.previousPosition = callData.position;
    publicAPI.onButtonDown(1, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonPress = (callData) => {
    model.previousPosition = callData.position;
    publicAPI.onButtonDown(2, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonPress = (callData) => {
    model.previousPosition = callData.position;
    publicAPI.onButtonDown(3, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleButton3D = (ed) => {
    if (!ed) {
      return;
    }

    // Look for a matching 3D camera interactor.
    model.currentManipulator = publicAPI.findVRManipulator(
      ed.device,
      ed.input,
      ed.pressed
    );
    if (model.currentManipulator) {
      model.currentManipulator.onButton3D(
        publicAPI,
        ed.pokedRenderer,
        model.state,
        ed.device,
        ed.input,
        ed.pressed
      );
      if (ed.pressed) {
        publicAPI.startCameraPose();
      } else {
        publicAPI.endCameraPose();
      }
    } else {
      vtkDebugMacro('No manipulator found');
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMove3D = (ed) => {
    if (model.currentManipulator && model.state === States.IS_CAMERA_POSE) {
      model.currentManipulator.onMove3D(
        publicAPI,
        ed.pokedRenderer,
        model.state,
        ed
      );
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.onButtonDown = (button, callData) => {
    // Must not be processing an interaction to start another.
    if (model.currentManipulator) {
      return;
    }

    // Look for a matching camera interactor.
    model.currentManipulator = publicAPI.findMouseManipulator(
      button,
      callData.shiftKey,
      callData.controlKey,
      callData.altKey
    );
    if (model.currentManipulator) {
      if (model.currentManipulator.setCenter) {
        model.currentManipulator.setCenter(model.centerOfRotation);
      }
      if (model.currentManipulator.setRotationFactor) {
        model.currentManipulator.setRotationFactor(model.rotationFactor);
      }
      model.currentManipulator.startInteraction();
      model.currentManipulator.onButtonDown(
        model._interactor,
        callData.pokedRenderer,
        callData.position
      );
      model._interactor.requestAnimation(publicAPI.onButtonDown);
      publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    } else {
      vtkDebugMacro('No manipulator found');
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.findMouseManipulator = (button, shift, control, alt) => {
    // Look for a matching camera manipulator
    let manipulator = null;
    let count = model.mouseManipulators.length;
    while (count--) {
      const manip = model.mouseManipulators[count];
      if (
        manip &&
        manip.getButton() === button &&
        manip.getShift() === shift &&
        manip.getControl() === control &&
        manip.getAlt() === alt &&
        manip.isDragEnabled()
      ) {
        manipulator = manip;
      }
    }
    return manipulator;
  };

  //-------------------------------------------------------------------------
  publicAPI.findVRManipulator = (device, input) => {
    // Look for a matching camera manipulator
    let manipulator = null;
    let count = model.vrManipulators.length;
    while (count--) {
      const manip = model.vrManipulators[count];
      if (manip && manip.getDevice() === device && manip.getInput() === input) {
        manipulator = manip;
      }
    }
    return manipulator;
  };

  //-------------------------------------------------------------------------
  publicAPI.handleLeftButtonRelease = () => {
    publicAPI.onButtonUp(1);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonRelease = () => {
    publicAPI.onButtonUp(2);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonRelease = () => {
    publicAPI.onButtonUp(3);
  };

  //-------------------------------------------------------------------------
  publicAPI.onButtonUp = (button) => {
    if (!model.currentManipulator) {
      return;
    }
    if (
      model.currentManipulator.getButton &&
      model.currentManipulator.getButton() === button
    ) {
      model.currentManipulator.onButtonUp(model._interactor);
      model.currentManipulator.endInteraction();
      model.currentManipulator = null;
      model._interactor.cancelAnimation(publicAPI.onButtonDown);
      publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleStartMouseWheel = (callData) => {
    // Must not be processing a wheel interaction to start another.
    if (model.currentWheelManipulator) {
      return;
    }

    let manipulator = null;
    let count = model.mouseManipulators.length;
    while (count--) {
      const manip = model.mouseManipulators[count];
      if (
        manip &&
        manip.isScrollEnabled() &&
        manip.getShift() === callData.shiftKey &&
        manip.getControl() === callData.controlKey &&
        manip.getAlt() === callData.altKey
      ) {
        manipulator = manip;
      }
    }
    if (manipulator) {
      model.currentWheelManipulator = manipulator;
      model.currentWheelManipulator.onStartScroll(
        model._interactor,
        callData.pokedRenderer,
        callData.spinY
      );
      model.currentWheelManipulator.startInteraction();
      model._interactor.requestAnimation(publicAPI.handleStartMouseWheel);
      publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
    } else {
      vtkDebugMacro('No manipulator found');
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleEndMouseWheel = () => {
    if (!model.currentWheelManipulator) {
      return;
    }
    if (model.currentWheelManipulator.onEndScroll) {
      model.currentWheelManipulator.onEndScroll(model._interactor);
      model.currentWheelManipulator.endInteraction();
      model.currentWheelManipulator = null;
      model._interactor.cancelAnimation(publicAPI.handleStartMouseWheel);
      publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMouseWheel = (callData) => {
    if (
      model.currentWheelManipulator &&
      model.currentWheelManipulator.onScroll
    ) {
      model.currentWheelManipulator.onScroll(
        model._interactor,
        callData.pokedRenderer,
        callData.spinY,
        model.cachedMousePosition
      );
      publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMouseMove = (callData) => {
    model.cachedMousePosition = callData.position;
    if (model.currentManipulator && model.currentManipulator.onMouseMove) {
      model.currentManipulator.onMouseMove(
        model._interactor,
        callData.pokedRenderer,
        callData.position
      );
      publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
    }
  };

  //-------------------------------------------------------------------------
  // Keyboard
  //-------------------------------------------------------------------------
  publicAPI.handleKeyPress = (callData) => {
    model.keyboardManipulators
      .filter((m) => m.onKeyPress)
      .forEach((manipulator) => {
        manipulator.onKeyPress(
          model._interactor,
          callData.pokedRenderer,
          callData.key
        );
        publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
      });
  };

  //-------------------------------------------------------------------------
  publicAPI.handleKeyDown = (callData) => {
    model.keyboardManipulators
      .filter((m) => m.onKeyDown)
      .forEach((manipulator) => {
        manipulator.onKeyDown(
          model._interactor,
          callData.pokedRenderer,
          callData.key
        );
        publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
      });
  };

  //-------------------------------------------------------------------------
  publicAPI.handleKeyUp = (callData) => {
    model.keyboardManipulators
      .filter((m) => m.onKeyUp)
      .forEach((manipulator) => {
        manipulator.onKeyUp(
          model._interactor,
          callData.pokedRenderer,
          callData.key
        );
        publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
      });
  };

  //-------------------------------------------------------------------------
  // Gesture
  //-------------------------------------------------------------------------

  publicAPI.handleStartPinch = (callData) => {
    publicAPI.startDolly();
    let count = model.gestureManipulators.length;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPinchEnabled()) {
        manipulator.onStartPinch(model._interactor, callData.scale);
        manipulator.startInteraction();
      }
    }
    model._interactor.requestAnimation(publicAPI.handleStartPinch);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
  };

  //--------------------------------------------------------------------------
  publicAPI.handleEndPinch = () => {
    publicAPI.endDolly();
    let count = model.gestureManipulators.length;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPinchEnabled()) {
        manipulator.onEndPinch(model._interactor);
        manipulator.endInteraction();
      }
    }
    model._interactor.cancelAnimation(publicAPI.handleStartPinch);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };

  //----------------------------------------------------------------------------
  publicAPI.handleStartRotate = (callData) => {
    publicAPI.startRotate();
    let count = model.gestureManipulators.length;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isRotateEnabled()) {
        manipulator.onStartRotate(model._interactor, callData.rotation);
        manipulator.startInteraction();
      }
    }
    model._interactor.requestAnimation(publicAPI.handleStartRotate);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
  };

  //--------------------------------------------------------------------------
  publicAPI.handleEndRotate = () => {
    publicAPI.endRotate();
    let count = model.gestureManipulators.length;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isRotateEnabled()) {
        manipulator.onEndRotate(model._interactor);
        manipulator.endInteraction();
      }
    }
    model._interactor.cancelAnimation(publicAPI.handleStartRotate);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };

  //----------------------------------------------------------------------------
  publicAPI.handleStartPan = (callData) => {
    publicAPI.startPan();
    let count = model.gestureManipulators.length;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPanEnabled()) {
        manipulator.onStartPan(model._interactor, callData.translation);
        manipulator.startInteraction();
      }
    }
    model._interactor.requestAnimation(publicAPI.handleStartPan);
    publicAPI.invokeStartInteractionEvent(START_INTERACTION_EVENT);
  };

  //--------------------------------------------------------------------------
  publicAPI.handleEndPan = () => {
    publicAPI.endPan();
    let count = model.gestureManipulators.length;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPanEnabled()) {
        manipulator.onEndPan(model._interactor);
        manipulator.endInteraction();
      }
    }
    model._interactor.cancelAnimation(publicAPI.handleStartPan);
    publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
  };

  //----------------------------------------------------------------------------
  publicAPI.handlePinch = (callData) => {
    let count = model.gestureManipulators.length;
    let actionCount = 0;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPinchEnabled()) {
        manipulator.onPinch(
          model._interactor,
          callData.pokedRenderer,
          callData.scale
        );
        actionCount++;
      }
    }
    if (actionCount) {
      publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.handlePan = (callData) => {
    let count = model.gestureManipulators.length;
    let actionCount = 0;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPanEnabled()) {
        manipulator.onPan(
          model._interactor,
          callData.pokedRenderer,
          callData.translation
        );
        actionCount++;
      }
    }
    if (actionCount) {
      publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.handleRotate = (callData) => {
    let count = model.gestureManipulators.length;
    let actionCount = 0;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isRotateEnabled()) {
        manipulator.onRotate(
          model._interactor,
          callData.pokedRenderer,
          callData.rotation
        );
        actionCount++;
      }
    }
    if (actionCount) {
      publicAPI.invokeInteractionEvent(INTERACTION_EVENT);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cachedMousePosition: null,
  currentManipulator: null,
  currentWheelManipulator: null,
  // mouseManipulators: null,
  // keyboardManipulators: null,
  // vrManipulators: null,
  // gestureManipulators: null,
  centerOfRotation: [0, 0, 0],
  rotationFactor: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyle.extend(publicAPI, model, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['rotationFactor']);
  macro.get(publicAPI, model, [
    'mouseManipulators',
    'keyboardManipulators',
    'vrManipulators',
    'gestureManipulators',
  ]);

  macro.setGetArray(publicAPI, model, ['centerOfRotation'], 3);

  // Object specific methods
  vtkInteractorStyleManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkInteractorStyleManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
