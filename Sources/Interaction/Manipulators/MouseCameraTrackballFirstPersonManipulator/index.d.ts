import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { vtkObject } from '../../../interfaces';

export interface vtkMouseCameraTrackballFirstPersonManipulator
  extends
    vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {
  /**
   * Yaws and pitches the camera, spread over `numAnimationSteps` animation
   * frames.
   * @param yaw yaw in degrees
   * @param pitch pitch in degrees
   */
  moveCamera(yaw: number, pitch: number): void;

  /**
   * Gets the number of animation steps a camera move is spread over.
   */
  getNumAnimationSteps(): number;

  /**
   * Sets the number of animation steps a camera move is spread over.
   * @param numAnimationSteps
   */
  setNumAnimationSteps(numAnimationSteps: number): boolean;

  /**
   * Gets the factor applied to the mouse movement.
   */
  getSensitivity(): number;

  /**
   * Sets the factor applied to the mouse movement.
   * @param sensitivity
   */
  setSensitivity(sensitivity: number): boolean;

  /**
   * Gets whether the pointer is locked on button down.
   */
  getUsePointerLock(): boolean;

  /**
   * Sets whether the pointer is locked on button down.
   * @param usePointerLock
   */
  setUsePointerLock(usePointerLock: boolean): boolean;
}

export interface IMouseCameraTrackballFirstPersonManipulatorInitialValues
  extends
    ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {
  numAnimationSteps?: number;
  sensitivity?: number;
  usePointerLock?: boolean;
}

export function newInstance(
  initialValues?: IMouseCameraTrackballFirstPersonManipulatorInitialValues
): vtkMouseCameraTrackballFirstPersonManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraTrackballFirstPersonManipulatorInitialValues
): void;

/**
 * First-person style camera control: mouse movement yaws and pitches the
 * camera in place, optionally using pointer lock.
 */
export declare const vtkMouseCameraTrackballFirstPersonManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraTrackballFirstPersonManipulator;
