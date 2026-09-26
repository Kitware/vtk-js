import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

export interface vtkMouseCameraUnicamManipulator
  extends
    vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {
  /**
   * Gets whether the delegate rotate manipulator keeps the camera view up
   * aligned with the world up vector.
   */
  getUseWorldUpVec(): boolean;

  /**
   * Sets whether the delegate rotate manipulator keeps the camera view up
   * aligned with the world up vector.
   * @param useWorldUpVec
   */
  setUseWorldUpVec(useWorldUpVec: boolean): void;

  /**
   * Gets the world up vector of the delegate rotate manipulator.
   */
  getWorldUpVec(): Vector3;

  /**
   * Sets the world up vector of the delegate rotate manipulator.
   * @param x
   * @param y
   * @param z
   */
  setWorldUpVec(x: number, y: number, z: number): void;

  /**
   * Gets whether the delegate rotate manipulator uses the hardware selector.
   */
  getUseHardwareSelector(): boolean;

  /**
   * Sets whether the delegate rotate manipulator uses the hardware selector.
   * @param useHardwareSelector
   */
  setUseHardwareSelector(useHardwareSelector: boolean): void;

  /**
   * Reads the focus sphere color of the delegate rotate manipulator.
   */
  getFocusSphereColor(): void;

  /**
   * Sets the focus sphere color of the delegate rotate manipulator.
   * @param r
   * @param g
   * @param b
   */
  setFocusSphereColor(r: number, g: number, b: number): void;

  /**
   * Gets the focus sphere radius factor of the delegate rotate manipulator.
   */
  getFocusSphereRadiusFactor(): number;

  /**
   * Sets the focus sphere radius factor of the delegate rotate manipulator.
   * @param focusSphereRadiusFactor
   */
  setFocusSphereRadiusFactor(focusSphereRadiusFactor: number): void;
}

export interface IMouseCameraUnicamManipulatorInitialValues
  extends
    ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {}

export function newInstance(
  initialValues?: IMouseCameraUnicamManipulatorInitialValues
): vtkMouseCameraUnicamManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraUnicamManipulatorInitialValues
): void;

/**
 * Unicam camera control on a single mouse button: the initial drag direction
 * chooses between rotate (delegated to vtkMouseCameraUnicamRotateManipulator),
 * pan and dolly, all correlated with the point picked under the cursor.
 */
export declare const vtkMouseCameraUnicamManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraUnicamManipulator;
