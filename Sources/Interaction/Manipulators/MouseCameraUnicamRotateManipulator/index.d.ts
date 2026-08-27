import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { States } from '../../../Rendering/Core/InteractorStyle/Constants';
import { vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 * `macro.get(publicAPI, model, ['state'])` replaces the vtkObject `getState()`
 * serializer with an accessor on the interaction state.
 */
export interface vtkMouseCameraUnicamRotateManipulator
  extends
    Omit<vtkObject, 'getState'>,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {
  /**
   * Gets the current interaction state.
   */
  getState(): States;

  /**
   * Gets the world position picked on the last button down.
   */
  getDownPoint(): Vector3;

  /**
   * Gets the picked world position array by reference.
   */
  getDownPointByReference(): Vector3;

  /**
   * Gets the world up vector.
   */
  getWorldUpVec(): Vector3;

  /**
   * Gets the world up vector array by reference.
   */
  getWorldUpVecByReference(): Vector3;

  /**
   * Sets the world up vector.
   * @param worldUpVec
   */
  setWorldUpVec(worldUpVec: Vector3): boolean;
  setWorldUpVec(x: number, y: number, z: number): boolean;

  /**
   * Sets the world up vector from another array, without a copy.
   * @param worldUpVec
   */
  setWorldUpVecFrom(worldUpVec: Vector3): void;

  /**
   * Gets whether the camera view up is kept aligned with the world up vector.
   */
  getUseWorldUpVec(): boolean;

  /**
   * Sets whether the camera view up is kept aligned with the world up vector.
   * @param useWorldUpVec
   */
  setUseWorldUpVec(useWorldUpVec: boolean): boolean;

  /**
   * Gets whether the hardware selector is used to pick the down point.
   */
  getUseHardwareSelector(): boolean;

  /**
   * Sets whether the hardware selector is used to pick the down point.
   * @param useHardwareSelector
   */
  setUseHardwareSelector(useHardwareSelector: boolean): boolean;

  /**
   * Gets whether the focus sphere is displayed on button down.
   */
  getDisplayFocusSphereOnButtonDown(): boolean;

  /**
   * Sets whether the focus sphere is displayed on button down.
   * @param displayFocusSphereOnButtonDown
   */
  setDisplayFocusSphereOnButtonDown(
    displayFocusSphereOnButtonDown: boolean
  ): boolean;

  /**
   * Gets the factor scaling the apparent size of the focus sphere.
   */
  getFocusSphereRadiusFactor(): number;

  /**
   * Sets the factor scaling the apparent size of the focus sphere.
   * @param focusSphereRadiusFactor
   */
  setFocusSphereRadiusFactor(focusSphereRadiusFactor: number): boolean;

  /**
   * Reads the focus sphere color from its property.
   */
  getFocusSphereColor(): void;

  /**
   * Sets the focus sphere color.
   * @param r
   * @param g
   * @param b
   */
  setFocusSphereColor(r: number, g: number, b: number): void;
}

export interface IMouseCameraUnicamRotateManipulatorInitialValues
  extends
    ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {
  focusSphereRadiusFactor?: number;
  displayFocusSphereOnButtonDown?: boolean;
  useHardwareSelector?: boolean;
  useWorldUpVec?: boolean;
  worldUpVec?: Vector3;
}

export function newInstance(
  initialValues?: IMouseCameraUnicamRotateManipulatorInitialValues
): vtkMouseCameraUnicamRotateManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraUnicamRotateManipulatorInitialValues
): void;

/**
 * Unicam rotation: the point picked under the cursor becomes the center of a
 * virtual sphere the camera is rotated on, materialized by a focus sphere
 * actor added to the renderer while rotating.
 */
export declare const vtkMouseCameraUnicamRotateManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraUnicamRotateManipulator;
