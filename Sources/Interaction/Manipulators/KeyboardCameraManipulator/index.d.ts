import { Vector3 } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkCompositeKeyboardManipulator from '../CompositeKeyboardManipulator';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import vtkCamera from '../../../Rendering/Core/Camera';
import vtkRenderer from '../../../Rendering/Core/Renderer';

export interface vtkKeyboardCameraManipulator
  extends vtkObject,
    vtkCompositeKeyboardManipulator {
  /**
   * Returns whether a movement is ongoing.
   */
  inMotion(): boolean;

  /**
   * Reset the movement speed to be proportional to the longest length of the renderer's bounds.
   */
  resetMovementSpeed(): void;

  /**
   * Initialize a movement of the current camera.
   */
  startMovement(): void;

  /**
   * Cancel any ongoing camera movement.
   */
  endMovement(): void;

  /**
   * Update active camera direction, depending on currently pressed keys.
   */
  calculateCurrentDirection(): void;

  /**
   * Returns the direction vector of the given camera for the given key.
   * @param key the movedkey
   * @param camera the camera
   */
  getDirectionFromKey(key: KeyboardEvent['key'], camera: vtkCamera): Vector3;

  /**
   * Moves the given camera, in the given direction, at the given speed.
   * @param camera the moved camera
   * @param direction the direction of the movemnt
   * @param speed the speed
   */
  moveCamera(camera: vtkCamera, direction: Vector3, speed: number): void;

  /**
   * Handles a keypress event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param key the key
   */
  onKeyPress(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    key: KeyboardEvent['key']
  ): void;

  /**
   * Handles a keydown event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param key the key
   */
  onKeyDown(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    key: KeyboardEvent['key']
  ): void;

  /**
   * Handles a keyup event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param key the key
   */
  onKeyUp(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    key: KeyboardEvent['key']
  ): void;
}

export interface IKeyboardCameraManipulatorInitialValues {
  movementSpeed?: number;
  moveForwardKeys?: KeyboardEvent['key'][];
  moveLeftKeys?: KeyboardEvent['key'][];
  moveBackwardKeys?: KeyboardEvent['key'][];
  moveRightKeys?: KeyboardEvent['key'][];
  moveUpKeys?: KeyboardEvent['key'][];
  moveDownKeys?: KeyboardEvent['key'][];
}

export function newInstance(
  initialValues?: IKeyboardCameraManipulatorInitialValues
): vtkKeyboardCameraManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IKeyboardCameraManipulatorInitialValues
): void;

export const vtkKeyboardCameraManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkKeyboardCameraManipulator;
