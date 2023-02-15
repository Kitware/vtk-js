import vtkCompositeGestureManipulator from '../../Manipulators/CompositeGestureManipulator';
import vtkCompositeKeyboardManipulator from '../../Manipulators/CompositeKeyboardManipulator';
import vtkCompositeMouseManipulator from '../../Manipulators/CompositeMouseManipulator';
import vtkCompositeVRManipulator from '../../Manipulators/CompositeVRManipulator';
import vtkInteractorStyle from '../../../Rendering/Core/InteractorStyle';
import {
  Device,
  Input,
} from '../../../Rendering/Core/RenderWindowInteractor/Constants';
import { Nullable, Vector3 } from '../../../types';

export interface vtkInteractorStyleManipulator extends vtkInteractorStyle {
  /**
   * Remove all manipulators.
   */
  removeAllManipulators(): void;

  /**
   * Remove mouse manipulators.
   */
  removeAllMouseManipulators(): void;

  /**
   * Remove keyboard manipulators.
   */
  removeAllKeyboardManipulators(): void;

  /**
   * Remove VR manipulators.
   */
  removeAllVRManipulators(): void;

  /**
   * Remove gesture manipulators.
   */
  removeAllGestureManipulators(): void;

  /**
   * Adds a mouse manipulator.
   * @param manipulator the manipulator to add
   * @returns whether the manipulator has been added
   */
  addMouseManipulator(manipulator: vtkCompositeMouseManipulator): boolean;

  /**
   * Adds a keyboard manipulator.
   * @param manipulator the manipulator to add
   * @returns whether the manipulator has been added
   */
  addKeyboardManipulator(manipulator: vtkCompositeKeyboardManipulator): boolean;

  /**
   * Adds a VR manipulator.
   * @param manipulator the manipulator to add
   * @returns whether the manipulator has been added
   */
  addVRManipulator(manipulator: vtkCompositeVRManipulator): boolean;

  /**
   * Adds a gesture manipulator.
   * @param manipulator the manipulator to add
   * @returns whether the manipulator has been added
   */
  addGestureManipulator(manipulator: vtkCompositeGestureManipulator): boolean;

  /**
   * Removes a mouse manipulator.
   * @param manipulator the manipulator to remove
   */
  removeMouseManipulator(manipulator: vtkCompositeMouseManipulator): void;

  /**
   * Removes a keyboard manipulator.
   * @param manipulator the manipulator to remove
   */
  removeKeyboardManipulator(manipulator: vtkCompositeKeyboardManipulator): void;

  /**
   * Removes a VR manipulator.
   * @param manipulator the manipulator to remove
   */
  removeVRManipulator(manipulator: vtkCompositeVRManipulator): void;

  /**
   * Removes a gesture manipulator.
   * @param manipulator the manipulator to remove
   */
  removeGestureManipulator(manipulator: vtkCompositeGestureManipulator): void;

  /**
   * Gets the number of mouse manipulators.
   */
  getNumberOfMouseManipulators(): number;

  /**
   * Gets the number of keyboard manipulators.
   */
  getNumberOfKeyboardManipulators(): number;

  /**
   * Gets the number of VR manipulators.
   */
  getNumberOfVRManipulators(): number;

  /**
   * Gets the number of gesture manipulators.
   */
  getNumberOfGestureManipulators(): number;

  /**
   * Resets/clears the current manipulator.
   */
  resetCurrentManipulator(): void;

  /**
   * Finds a mouse manipulator with a given control set.
   * @param button which button
   * @param shift shift enabled
   * @param scroll scroll enabled
   * @param alt alt enabled
   */
  findMouseManipulator(
    button: number,
    shift: boolean,
    scroll: boolean,
    alt: boolean
  ): Nullable<vtkCompositeMouseManipulator>;

  /**
   * Finds a VR manipulator with a given device + input.
   * @param device
   * @param input
   */
  findVRManipulator(
    device: Device,
    input: Input
  ): Nullable<vtkCompositeVRManipulator>;

  /**
   * Handles a left button press event.
   * @param callData event data
   */
  handleLeftButtonPress(callData: unknown): void;

  /**
   * Handles a middle button press event.
   * @param callData event data
   */
  handleMiddleButtonPress(callData: unknown): void;

  /**
   * Handles a right button press event.
   * @param callData event data
   */
  handleRightButtonPress(callData: unknown): void;

  /**
   * Handles a left button release event.
   * @param callData event data
   */
  handleLeftButtonRelease(callData: unknown): void;

  /**
   * Handles a middle button release event.
   * @param callData event data
   */
  handleMiddleButtonRelease(callData: unknown): void;

  /**
   * Handles a right button release event.
   * @param callData event data
   */
  handleRightButtonRelease(callData: unknown): void;

  /**
   * Handles the start of a wheel event.
   * @param callData event data
   */
  handleStartMouseWheel(callData: unknown): void;

  /**
   * Handles a wheel event.
   * @param callData event data
   */
  handleMouseWheel(callData: unknown): void;

  /**
   * Handles the end of a wheel event.
   * @param callData event data
   */
  handleEndMouseWheel(callData: unknown): void;

  /**
   * Handles a mouse move.
   * @param callData event data
   */
  handleMouseMove(callData: unknown): void;

  /**
   * Handles a 3D button event.
   * @param callData event data
   */
  handleButton3D(ed: unknown): void;

  /**
   * Handles a 3D move event.
   * @param ed event data
   */
  handleMove3D(ed: unknown): void;

  /**
   * Handles a keypress.
   * @param callData event data
   */
  handleKeyPress(callData: unknown): void;

  /**
   * Handles a keydown event.
   * @param callData event data
   */
  handleKeyDown(callData: unknown): void;

  /**
   * Handles a keyup event.
   * @param callData event data
   */
  handleKeyUp(callData: unknown): void;

  /**
   * Handles the start of a pinch gesture.
   * @param callData event data
   */
  handleStartPinch(callData: unknown): void;

  /**
   * Handles the end of a pinch gesture.
   * @param callData event data
   */
  handleEndPinch(callData: unknown): void;

  /**
   * Handles the start of a rotate gesture.
   * @param callData event data
   */
  handleStartRotate(callData: unknown): void;

  /**
   * Handles the end of a rotate gesture.
   * @param callData event data
   */
  handleEndRotate(callData: unknown): void;

  /**
   * Handles the start of a pan gesture.
   * @param callData event data
   */
  handleStartPan(callData: unknown): void;

  /**
   * Handles the end of a pan gesture.
   * @param callData event data
   */
  handleEndPan(callData: unknown): void;

  /**
   * Handles a pinch gesture.
   * @param callData event data
   */
  handlePinch(callData: unknown): void;

  /**
   * Handles a rotate gesture.
   * @param callData event data
   */
  handleRotate(callData: unknown): void;

  /**
   * Handles a pan gesture.
   * @param callData event data
   */
  handlePan(callData: unknown): void;

  /**
   * Handles a button down event.
   * @param button which button
   * @param callData event data
   */
  onButtonDown(button: number, callData: unknown): void;

  /**
   * Handles a button up event.
   * @param button which button
   */
  onButtonUp(button: number): void;

  /**
   * Sets the rotation factor.
   * @param factor rotation factor
   */
  setRotationFactor(factor: number): boolean;

  /**
   * Gets the rotation factor.
   */
  getRotationFactor(): number;

  getMouseManipulators(): vtkCompositeMouseManipulator[];
  getMouseManipulators(): vtkCompositeMouseManipulator[];
  getMouseManipulators(): vtkCompositeMouseManipulator[];
  getMouseManipulators(): vtkCompositeMouseManipulator[];

  /**
   * Sets the center of rotation
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  setCenterOfRotation(x: number, y: number, z: number): boolean;
  setCenterOfRotation(xyz: Vector3): boolean;

  /**
   * Gets the center of rotation.
   * @returns {Vector3}
   */
  getCenterOfRotation(): Vector3;
}

export interface IInteractorStyleManipulatorInitialValues {
  centerOfRotation?: Vector3;
  rotationFactor?: number;
}

export function newInstance(
  initialValues?: IInteractorStyleManipulatorInitialValues
): vtkInteractorStyleManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleManipulatorInitialValues
): void;

export const vtkInteractorStyleManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleManipulator;
