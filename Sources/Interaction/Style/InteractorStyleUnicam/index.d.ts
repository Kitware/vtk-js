import vtkInteractorStyleManipulator, {
  IInteractorStyleManipulatorInitialValues,
} from '../InteractorStyleManipulator';
import { Vector3 } from '../../../types';

export interface vtkInteractorStyleUnicam extends vtkInteractorStyleManipulator {
  /**
   * Gets whether the unicam manipulator keeps the camera view up aligned with
   * the world up vector.
   */
  getUseWorldUpVec(): boolean;

  /**
   * Sets whether the unicam manipulator keeps the camera view up aligned with
   * the world up vector.
   * @param useWorldUpVec
   */
  setUseWorldUpVec(useWorldUpVec: boolean): void;

  /**
   * Gets the world up vector of the unicam manipulator.
   */
  getWorldUpVec(): Vector3;

  /**
   * Sets the world up vector of the unicam manipulator.
   * @param x
   * @param y
   * @param z
   */
  setWorldUpVec(x: number, y: number, z: number): void;

  /**
   * Gets whether the unicam manipulator uses the hardware selector.
   */
  getUseHardwareSelector(): boolean;

  /**
   * Sets whether the unicam manipulator uses the hardware selector.
   * @param useHardwareSelector
   */
  setUseHardwareSelector(useHardwareSelector: boolean): void;

  /**
   * Reads the focus sphere color of the unicam manipulator.
   */
  getFocusSphereColor(): void;

  /**
   * Sets the focus sphere color of the unicam manipulator.
   * @param r
   * @param g
   * @param b
   */
  setFocusSphereColor(r: number, g: number, b: number): void;

  /**
   * Gets the focus sphere radius factor of the unicam manipulator.
   */
  getFocusSphereRadiusFactor(): number;

  /**
   * Sets the focus sphere radius factor of the unicam manipulator.
   * @param focusSphereRadiusFactor
   */
  setFocusSphereRadiusFactor(focusSphereRadiusFactor: number): void;
}

export interface IInteractorStyleUnicamInitialValues extends IInteractorStyleManipulatorInitialValues {}

export function newInstance(
  initialValues?: IInteractorStyleUnicamInitialValues
): vtkInteractorStyleUnicam;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleUnicamInitialValues
): void;

/**
 * Manipulator style preconfigured with a single vtkMouseCameraUnicamManipulator
 * on the left button, and forwarding that manipulator's settings.
 */
export declare const vtkInteractorStyleUnicam: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkInteractorStyleUnicam;
