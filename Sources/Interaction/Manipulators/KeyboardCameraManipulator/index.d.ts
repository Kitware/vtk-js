import { Vector3, Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkCompositeKeyboardManipulator from '../CompositeKeyboardManipulator';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import vtkCamera from '../../../Rendering/Core/Camera';
import vtkRenderer from '../../../Rendering/Core/Renderer';

export interface vtkKeyboardCameraManipulator
  extends vtkObject, vtkCompositeKeyboardManipulator {
  /**
   * Get the movement speed.
   */
  getMovementSpeed(): Nullable<number>;

  /**
   * Set the movement speed.
   * @param speed
   */
  setMovementSpeed(speed: number): boolean;

  /**
   * Get the keys that trigger a forward movement.
   */
  getMoveForwardKeys(): KeyboardEvent['key'][];

  /**
   * Set the keys that trigger a forward movement.
   * @param keys
   */
  setMoveForwardKeys(keys: KeyboardEvent['key'][]): boolean;

  /**
   * Get the keys that trigger a leftward movement.
   */
  getMoveLeftKeys(): KeyboardEvent['key'][];

  /**
   * Set the keys that trigger a leftward movement.
   * @param keys
   */
  setMoveLeftKeys(keys: KeyboardEvent['key'][]): boolean;

  /**
   * Get the keys that trigger a backward movement.
   */
  getMoveBackwardKeys(): KeyboardEvent['key'][];

  /**
   * Set the keys that trigger a backward movement.
   * @param keys
   */
  setMoveBackwardKeys(keys: KeyboardEvent['key'][]): boolean;

  /**
   * Get the keys that trigger a rightward movement.
   */
  getMoveRightKeys(): KeyboardEvent['key'][];

  /**
   * Set the keys that trigger a rightward movement.
   * @param keys
   */
  setMoveRightKeys(keys: KeyboardEvent['key'][]): boolean;

  /**
   * Get the keys that trigger an upward movement.
   */
  getMoveUpKeys(): KeyboardEvent['key'][];

  /**
   * Set the keys that trigger an upward movement.
   * @param keys
   */
  setMoveUpKeys(keys: KeyboardEvent['key'][]): boolean;

  /**
   * Get the keys that trigger a downward movement.
   */
  getMoveDownKeys(): KeyboardEvent['key'][];

  /**
   * Set the keys that trigger a downward movement.
   * @param keys
   */
  setMoveDownKeys(keys: KeyboardEvent['key'][]): boolean;

  /**
   * Get the interactor associated with the current movement.
   */
  getInteractor(): Nullable<vtkRenderWindowInteractor>;

  /**
   * Set the interactor associated with the current movement.
   * @param interactor
   */
  setInteractor(interactor: vtkRenderWindowInteractor): boolean;

  /**
   * Get the renderer associated with the current movement.
   */
  getRenderer(): Nullable<vtkRenderer>;

  /**
   * Set the renderer associated with the current movement.
   * @param renderer
   */
  setRenderer(renderer: vtkRenderer): boolean;

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
  getDirectionFromKey(
    key: KeyboardEvent['key'],
    camera: vtkCamera
  ): Vector3 | undefined;

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
  interactor?: vtkRenderWindowInteractor;
  renderer?: vtkRenderer;
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
