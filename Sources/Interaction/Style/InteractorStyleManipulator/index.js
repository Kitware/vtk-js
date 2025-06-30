import macro from 'vtk.js/Sources/macros';
import { MouseButton } from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor/Constants';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';
import { mat4, vec3 } from 'gl-matrix';

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

function getCameraMatrix(renderer, tempMatrix) {
  const cam = renderer.getActiveCamera();
  if (cam) {
    mat4.copy(tempMatrix, cam.getViewMatrix());
    return tempMatrix;
  }
  return null;
}

/**
 * Transforms a vector by the transformation delta between two matrices.
 *
 * @param {Object} tempObjects - Temporary matrices/vectors for computation
 * @param {mat4} beforeMatrix - Matrix before transformation
 * @param {mat4} afterMatrix - Matrix after transformation
 * @param {Array} vector - Vector to transform [x, y, z]
 * @returns {Array} Transformed vector [x, y, z]
 */
function transformVectorByTransformation(
  tempObjects,
  beforeMatrix,
  afterMatrix,
  vector
) {
  const { matrixA, matrixB, identityMatrix, newCenter } = tempObjects;

  // The view matrix from vtk.js is row-major, but gl-matrix expects column-major.
  // We need to transpose them before use.
  mat4.transpose(matrixA, beforeMatrix);

  mat4.transpose(matrixB, afterMatrix);
  mat4.invert(matrixB, matrixB);

  // Compute delta transformation matrix
  mat4.multiply(matrixA, matrixB, matrixA);

  // Apply transformation if matrix changed
  if (!mat4.equals(matrixA, identityMatrix)) {
    vec3.transformMat4(newCenter, vector, matrixA);
    return newCenter;
  }
  return vector;
}

/**
 * Computes the new center of rotation based on camera movement.
 * When the camera moves (pan), the center of rotation should move
 * by the same transformation to maintain consistent rotation behavior.
 *
 * @param {Object} tempObjects - Temporary matrices/vectors for computation
 * @param {Object} renderer - VTK renderer
 * @param {mat4} beforeCameraMatrix - Camera view matrix before movement
 * @param {Array} oldCenterOfRotation - Previous center of rotation [x, y, z]
 * @returns {Array} New center of rotation [x, y, z]
 */
function computeNewCenterOfRotation(
  tempObjects,
  renderer,
  beforeCameraMatrix,
  oldCenterOfRotation
) {
  const cam = renderer.getActiveCamera();
  if (!cam || !beforeCameraMatrix) {
    return oldCenterOfRotation;
  }
  const afterMatrixRowMajor = cam.getViewMatrix();

  return transformVectorByTransformation(
    tempObjects,
    beforeCameraMatrix,
    afterMatrixRowMajor,
    oldCenterOfRotation
  );
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

  // Initialize temporary objects to reduce garbage collection
  const tempCameraMatrix = mat4.create();
  const tempComputeObjects = {
    matrixA: mat4.create(),
    matrixB: mat4.create(),
    identityMatrix: mat4.identity(mat4.create()),
    newCenter: vec3.create(),
  };

  model.currentVRManipulators = new Map();
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
    publicAPI.onButtonDown(MouseButton.LeftButton, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonPress = (callData) => {
    model.previousPosition = callData.position;
    publicAPI.onButtonDown(MouseButton.MiddleButton, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonPress = (callData) => {
    model.previousPosition = callData.position;
    publicAPI.onButtonDown(MouseButton.RightButton, callData);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleButton3D = (ed) => {
    if (!ed) {
      return;
    }

    // Look for a matching 3D camera interactor.
    const manipulator = publicAPI.findVRManipulator(
      ed.device,
      ed.input,
      ed.pressed
    );

    if (manipulator) {
      // register the manipulator for this device
      model.currentVRManipulators.set(ed.device, manipulator);

      manipulator.onButton3D(publicAPI, model.getRenderer(ed), model.state, ed);

      if (ed.pressed) {
        publicAPI.startCameraPose();
      } else {
        model.currentVRManipulators.delete(ed.device);

        // make sure we don't end camera pose if other VR manipulators are currently interacting
        if (model.currentVRManipulators.size === 0) {
          publicAPI.endCameraPose();
        }
      }
    } else {
      vtkDebugMacro('No manipulator found');
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMove3D = (ed) => {
    const manipulator = model.currentVRManipulators.get(ed.device);

    if (manipulator && model.state === States.IS_CAMERA_POSE) {
      manipulator.onMove3D(publicAPI, model.getRenderer(ed), model.state, ed);
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
        model.getRenderer(callData),
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
    publicAPI.onButtonUp(MouseButton.LeftButton);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonRelease = () => {
    publicAPI.onButtonUp(MouseButton.MiddleButton);
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonRelease = () => {
    publicAPI.onButtonUp(MouseButton.RightButton);
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
      if (!model._interactor.isPointerLocked()) {
        model.currentManipulator = null;
      }
      publicAPI.invokeEndInteractionEvent(END_INTERACTION_EVENT);
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleEndPointerLock = () => {
    model.currentManipulator = null;
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
        model.getRenderer(callData),
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
        model.getRenderer(callData),
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
      const renderer = model.getRenderer(callData);
      const beforeCameraMatrix = getCameraMatrix(renderer, tempCameraMatrix);

      model.currentManipulator.onMouseMove(
        model._interactor,
        renderer,
        callData.position
      );

      const newCenter = computeNewCenterOfRotation(
        tempComputeObjects,
        renderer,
        beforeCameraMatrix,
        model.centerOfRotation
      );
      publicAPI.setCenterOfRotation(newCenter);

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
          model.getRenderer(callData),
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
          model.getRenderer(callData),
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
          model.getRenderer(callData),
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
          model.getRenderer(callData),
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
    const renderer = model.getRenderer(callData);
    const beforeCameraMatrix = getCameraMatrix(renderer, tempCameraMatrix);

    let count = model.gestureManipulators.length;
    let actionCount = 0;
    while (count--) {
      const manipulator = model.gestureManipulators[count];
      if (manipulator && manipulator.isPanEnabled()) {
        manipulator.onPan(model._interactor, renderer, callData.translation);
        actionCount++;
      }
    }
    if (actionCount) {
      const newCenter = computeNewCenterOfRotation(
        tempComputeObjects,
        renderer,
        beforeCameraMatrix,
        model.centerOfRotation
      );
      publicAPI.setCenterOfRotation(newCenter);

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
          model.getRenderer(callData),
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

const defaultValues = (initialValues) => ({
  cachedMousePosition: null,
  currentManipulator: null,
  currentWheelManipulator: null,
  // mouseManipulators: null,
  // keyboardManipulators: null,
  // vrManipulators: null,
  // gestureManipulators: null,
  centerOfRotation: [0, 0, 0],
  rotationFactor: 1,
  ...initialValues,
});

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, defaultValues(initialValues));

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
