import macro from 'vtk.js/Sources/macro';
import vtkInteractorStyle from 'vtk.js/Sources/Rendering/Core/InteractorStyle';

const { vtkDebugMacro } = macro;

const DEFAULT_EVENT_POSITION = { x: 0, y: 0, z: 0 };

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function translateCamera(renderer, rwi, toX, toY, fromX, fromY) {
  const cam = renderer.getActiveCamera();
  let viewFocus = cam.getFocalPoint();

  viewFocus = rwi
    .getInteractorStyle()
    .computeWorldToDisplay(viewFocus[0], viewFocus[1], viewFocus[2]);
  const focalDepth = viewFocus[2];

  const newPickPoint = rwi
    .getInteractorStyle()
    .computeDisplayToWorld(toX, toY, focalDepth);
  const oldPickPoint = rwi
    .getInteractorStyle()
    .computeDisplayToWorld(fromX, fromY, focalDepth);

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
    const aSize = rwi.getView().getSize();
    const w = aSize[0];
    const h = aSize[1];
    const x0 = w / 2;
    const y0 = h / 2;
    const x1 = position.x;
    const y1 = position.y;
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
      .computeWorldToDisplay(viewFocus[0], viewFocus[1], viewFocus[2]);
    const newFp = rwi
      .getInteractorStyle()
      .computeDisplayToWorld(position.x, position.y, viewFocus[2]);

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

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  dollyToPosition,
  translateCamera,
};

// ----------------------------------------------------------------------------
// vtkInteractorStyleManipulator methods
// ----------------------------------------------------------------------------

function vtkInteractorStyleManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorStyleManipulator');

  model.mouseManipulators = [];
  model.camera3DManipulators = [];
  model.currentManipulator = null;
  model.centerOfRotation = [0, 0, 0];
  model.rotationFactor = 1;

  function updateCurrentRenderer() {
    const pos =
      model.interactor.getEventPosition(model.interactor.getPointerIndex()) ||
      DEFAULT_EVENT_POSITION;
    publicAPI.findPokedRenderer(pos.x, pos.y);
    return model.currentRenderer;
  }

  //-------------------------------------------------------------------------
  publicAPI.removeAllManipulators = () => {
    model.mouseManipulators = [];
  };

  //-------------------------------------------------------------------------
  publicAPI.removeAll3DManipulators = () => {
    model.camera3DManipulators = [];
  };

  //-------------------------------------------------------------------------
  publicAPI.removeManipulator = (index) => {
    if (model.mouseManipulators.length > index) {
      model.mouseManipulators[index] = null;
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.remove3DManipulator = (index) => {
    if (model.camera3DManipulators.length > index) {
      model.camera3DManipulators[index] = null;
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.getManipulator = (index) => {
    let manipulator = null;
    if (model.mouseManipulators.length > index) {
      manipulator = model.mouseManipulators[index];
    }
    return manipulator;
  };

  //-------------------------------------------------------------------------
  publicAPI.get3DManipulator = (index) => {
    let manipulator = null;
    if (model.camera3DManipulators.length > index) {
      manipulator = model.camera3DManipulators[index];
    }
    return manipulator;
  };

  //-------------------------------------------------------------------------
  publicAPI.addManipulator = (manipulator) => {
    const index = model.mouseManipulators.length;
    model.mouseManipulators.push(manipulator);
    return index;
  };

  //-------------------------------------------------------------------------
  publicAPI.add3DManipulator = (manipulator) => {
    const index = model.camera3DManipulators.length;
    model.camera3DManipulators.push(manipulator);
    return index;
  };

  //-------------------------------------------------------------------------
  publicAPI.getNumberOfManipulators = () => model.mouseManipulators.length;

  //-------------------------------------------------------------------------
  publicAPI.getNumberOf3DManipulators = () => model.camera3DManipulators.length;

  //-------------------------------------------------------------------------
  publicAPI.handleLeftButtonPress = () => {
    publicAPI.onButtonDown(
      1,
      model.interactor.getShiftKey(),
      model.interactor.getControlKey(),
      model.interactor.getAltKey()
    );
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMiddleButtonPress = () => {
    publicAPI.onButtonDown(
      2,
      model.interactor.getShiftKey(),
      model.interactor.getControlKey(),
      model.interactor.getAltKey()
    );
  };

  //-------------------------------------------------------------------------
  publicAPI.handleRightButtonPress = () => {
    publicAPI.onButtonDown(
      3,
      model.interactor.getShiftKey(),
      model.interactor.getControlKey(),
      model.interactor.getAltKey()
    );
  };

  //-------------------------------------------------------------------------
  publicAPI.handleButton3D = (arg) => {
    if (!model.currentRenderer) {
      publicAPI.findPokedRenderer(0, 0);
      if (!model.currentRenderer) {
        return;
      }
    }

    const ed = arg.calldata;
    if (!ed) {
      return;
    }

    // Look for a matching 3D camera interactor.
    model.currentManipulator = publicAPI.find3DManipulator(
      ed.device,
      ed.input,
      ed.pressed
    );
    if (model.currentManipulator) {
      publicAPI.invokeStartInteractionEvent({ type: 'StartInteractionEvent' });
      model.currentManipulator.onButton3D(
        publicAPI,
        model.currentRenderer,
        model.state,
        ed.device,
        ed.input,
        ed.pressed
      );
      publicAPI.setAnimationStateOn();
    } else {
      vtkDebugMacro('No manipulator found');
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleMove3D = (arg) => {
    const ed = arg.calldata;
    if (model.currentManipulator) {
      model.currentManipulator.onMove3D(
        publicAPI,
        model.currentRenderer,
        model.state,
        ed
      );
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.onButtonDown = (button, shift, control, alt) => {
    // Must not be processing an interaction to start another.
    if (model.currentManipulator) {
      return;
    }

    // Look for a matching camera interactor.
    model.currentManipulator = publicAPI.findManipulator(
      button,
      shift,
      control,
      alt
    );
    if (model.currentManipulator) {
      publicAPI.invokeStartInteractionEvent({ type: 'StartInteractionEvent' });
      if (model.currentManipulator.setCenter) {
        model.currentManipulator.setCenter(model.centerOfRotation);
      }
      if (model.currentManipulator.setRotationFactor) {
        model.currentManipulator.setRotationFactor(model.rotationFactor);
      }
      model.currentManipulator.startInteraction();
      model.currentManipulator.onButtonDown(model.interactor);
      publicAPI.setAnimationStateOn();
    } else {
      vtkDebugMacro('No manipulator found');
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.findManipulator = (button, shift, control, alt) => {
    // Look for a matching camera manipulator
    let manipulator = null;
    model.mouseManipulators.forEach((manip) => {
      if (
        manip &&
        manip.getButton() === button &&
        manip.getShift() === shift &&
        manip.getControl() === control &&
        manip.getAlt() === alt
      ) {
        manipulator = manip;
      }
    });
    return manipulator;
  };
  //-------------------------------------------------------------------------
  publicAPI.find3DManipulator = (device, input) => {
    // Look for a matching camera manipulator
    let manipulator = null;
    model.camera3DManipulators.forEach((manip) => {
      if (manip && manip.getDevice() === device && manip.getInput() === input) {
        manipulator = manip;
      }
    });
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
    if (model.currentManipulator === null) {
      return;
    }
    if (model.currentManipulator.getButton() === button) {
      publicAPI.setAnimationStateOff();
      model.currentManipulator.onButtonUp(model.interactor);
      model.currentManipulator.endInteraction();
      publicAPI.invokeEndInteractionEvent({ type: 'EndInteractionEvent' });
      model.currentManipulator = null;
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handlePinch = () => {
    model.mouseManipulators.filter((m) => m.onPinch).forEach((manipulator) => {
      if (manipulator && manipulator.getPinch()) {
        manipulator.onPinch(model.interactor);
      }
    });
    publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
  };

  //-------------------------------------------------------------------------
  publicAPI.handleAnimation = () => {
    if (
      model.currentManipulator &&
      (model.currentRenderer || updateCurrentRenderer())
    ) {
      model.currentManipulator.onAnimation(
        model.interactor,
        model.currentRenderer
      );
      publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
    }
  };

  //-------------------------------------------------------------------------
  publicAPI.handleChar = () => {
    model.mouseManipulators.filter((m) => m.onChar).forEach((manipulator) => {
      manipulator.onChar(model.interactor);
    });
    publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
  };

  //-------------------------------------------------------------------------
  publicAPI.resetLights = () => {
    if (!model.currentRenderer) {
      return;
    }

    model.currentRenderer.updateLightsGeometryToFollowCamera();
  };

  //-------------------------------------------------------------------------
  publicAPI.handleKeyPress = () => {
    model.mouseManipulators
      .filter((m) => m.onKeyDown)
      .forEach((manipulator) => {
        manipulator.onKeyDown(model.interactor);
      });
  };

  //-------------------------------------------------------------------------
  publicAPI.handleKeyUp = () => {
    model.mouseManipulators.filter((m) => m.onKeyUp).forEach((manipulator) => {
      manipulator.onKeyUp(model.interactor);
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  currentManipulator: null,
  mouseManipulators: null,
  camera3DManipulators: null,
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

export default Object.assign({ newInstance, extend }, STATIC);
