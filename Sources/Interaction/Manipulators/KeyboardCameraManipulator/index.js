import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkCompositeKeyboardManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeKeyboardManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { vtkErrorMacro } = macro;

const ANIMATION_REQUESTER = 'vtkKeyboardCameraManipulator';

// ----------------------------------------------------------------------------
// vtkKeyboardCameraManipulator methods
// ----------------------------------------------------------------------------

function vtkKeyboardCameraManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkKeyboardCameraManipulator');

  const internal = {
    keysDown: [],
    direction: [0, 0, 0],
    skipUpdateDirection: false,
    animationSub: null,
    cameraModifiedSub: null,
  };

  //--------------------------------------------------------------------------

  publicAPI.inMotion = () => internal.animationSub !== null;

  //--------------------------------------------------------------------------

  publicAPI.resetMovementSpeed = () => {
    // Reset the movement speed to be proportional to the longest length
    // of the renderer's bounds.
    const { renderer } = model;

    const bounds = renderer.computeVisiblePropBounds();

    // Just a number that seems to work okay for our examples...
    const divisor = 500;
    model.movementSpeed = vtkBoundingBox.getMaxLength(bounds) / divisor;
  };

  //--------------------------------------------------------------------------

  publicAPI.startMovement = () => {
    if (publicAPI.inMotion()) {
      vtkErrorMacro('Camera is already in motion!');
      return;
    }

    if (model.movementSpeed === null) {
      publicAPI.resetMovementSpeed();
    }

    const { interactor, renderer } = model;

    const move = () => {
      if (internal.keysDown.length === 0) {
        return;
      }

      // No need to update the direction when we move the camera here...
      internal.skipUpdateDirection = true;
      publicAPI.moveCamera(
        renderer.getActiveCamera(),
        internal.direction,
        model.movementSpeed
      );

      renderer.resetCameraClippingRange();

      if (interactor.getLightFollowCamera()) {
        renderer.updateLightsGeometryToFollowCamera();
      }
      internal.skipUpdateDirection = false;
    };

    publicAPI.calculateCurrentDirection();

    const camera = renderer.getActiveCamera();
    // If the camera gets modified elsewhere, let's update the direction
    internal.cameraModifiedSub = camera.onModified(
      publicAPI.calculateCurrentDirection
    );

    interactor.requestAnimation(ANIMATION_REQUESTER);
    internal.animationSub = interactor.onAnimation(() => move());
  };

  //--------------------------------------------------------------------------

  publicAPI.endMovement = () => {
    if (internal.animationSub) {
      internal.animationSub.unsubscribe();
      internal.animationSub = null;
    }

    model._interactor.cancelAnimation(ANIMATION_REQUESTER);

    if (internal.cameraModifiedSub) {
      internal.cameraModifiedSub.unsubscribe();
      internal.cameraModifiedSub = null;
    }
  };

  //--------------------------------------------------------------------------

  publicAPI.calculateCurrentDirection = () => {
    if (internal.skipUpdateDirection) {
      return;
    }

    // Reset
    internal.direction = [0, 0, 0];

    const { renderer } = model;

    if (!renderer) {
      return;
    }

    const camera = renderer.getActiveCamera();
    if (!camera) {
      return;
    }

    if (internal.keysDown.length === 0) {
      return;
    }

    let directions = internal.keysDown.map((key) =>
      publicAPI.getDirectionFromKey(key, camera)
    );
    directions = directions.filter((item) => item);

    if (directions.length === 0) {
      return;
    }

    const netDirection = directions.reduce((a, b) => {
      vtkMath.add(a, b, b);
      return b;
    });

    vtkMath.normalize(netDirection);

    internal.direction = netDirection;
  };

  //--------------------------------------------------------------------------

  publicAPI.getDirectionFromKey = (key, camera) => {
    let direction;

    if (model.moveForwardKeys.includes(key)) {
      // Move forward
      direction = camera.getDirectionOfProjection();
    } else if (model.moveLeftKeys.includes(key)) {
      // Move left
      const dirProj = camera.getDirectionOfProjection();
      direction = [0, 0, 0];
      vtkMath.cross(camera.getViewUp(), dirProj, direction);
    } else if (model.moveBackwardKeys.includes(key)) {
      // Move backward
      direction = camera.getDirectionOfProjection().map((e) => -e);
    } else if (model.moveRightKeys.includes(key)) {
      // Move right
      const dirProj = camera.getDirectionOfProjection();
      direction = [0, 0, 0];
      vtkMath.cross(dirProj, camera.getViewUp(), direction);
    } else if (model.moveUpKeys.includes(key)) {
      // Move up
      direction = camera.getViewUp();
    } else if (model.moveDownKeys.includes(key)) {
      // Move down
      direction = camera.getViewUp().map((e) => -e);
    } else {
      return undefined;
    }

    vtkMath.normalize(direction);

    return direction;
  };

  //--------------------------------------------------------------------------

  publicAPI.moveCamera = (camera, direction, speed) => {
    const position = camera.getPosition();
    const focalPoint = camera.getFocalPoint();

    camera.setFocalPoint(
      focalPoint[0] + direction[0] * speed,
      focalPoint[1] + direction[1] * speed,
      focalPoint[2] + direction[2] * speed
    );

    camera.setPosition(
      position[0] + direction[0] * speed,
      position[1] + direction[1] * speed,
      position[2] + direction[2] * speed
    );
  };

  //--------------------------------------------------------------------------

  publicAPI.onKeyPress = (interactor, renderer, key) => {};

  //--------------------------------------------------------------------------

  publicAPI.onKeyDown = (interactor, renderer, key) => {
    if (!internal.keysDown.includes(key)) {
      internal.keysDown.push(key);
      publicAPI.calculateCurrentDirection();
    }

    if (!publicAPI.inMotion()) {
      Object.assign(model, { interactor, renderer });
      publicAPI.startMovement();
    }
  };

  //--------------------------------------------------------------------------

  publicAPI.onKeyUp = (interactor, renderer, key) => {
    // The following is case insensitive for when the user
    // presses/releases the shift key while this key is down.
    internal.keysDown = internal.keysDown.filter(
      (item) => item.toUpperCase() !== key.toUpperCase()
    );
    publicAPI.calculateCurrentDirection();

    if (internal.keysDown.length === 0) {
      publicAPI.endMovement();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // The movementSpeed is the magnitude of the camera translation
  // for each animation frame (which occur each 1/60 second)
  // If null, publicAPI.resetMovementSpeed() will be called when
  // movement starts.
  movementSpeed: null,
  moveForwardKeys: ['w', 'W', 'ArrowUp'],
  moveLeftKeys: ['a', 'A', 'ArrowLeft'],
  moveBackwardKeys: ['s', 'S', 'ArrowDown'],
  moveRightKeys: ['d', 'D', 'ArrowRight'],
  moveUpKeys: [' '],
  moveDownKeys: ['Shift'],
  interactor: null,
  renderer: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeKeyboardManipulator.extend(publicAPI, model, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'movementSpeed',
    'moveForwardKeys',
    'moveLeftKeys',
    'moveBackwardKeys',
    'moveRightKeys',
    'moveUpKeys',
    'moveDownKeys',
    'interactor',
    'renderer',
  ]);

  // Object specific methods
  vtkKeyboardCameraManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkKeyboardCameraManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
