import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

export interface vtkMouseCameraAxisRotateManipulator
  extends
    vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {
  /**
   * Gets the axis the camera is rotated around.
   */
  getRotationAxis(): Vector3;

  /**
   * Sets the axis the camera is rotated around.
   * @param rotationAxis
   */
  setRotationAxis(rotationAxis: Vector3): boolean;

  /**
   * Gets whether the elevation is constrained to the positive half of the
   * rotation axis.
   */
  getUseHalfAxis(): boolean;

  /**
   * Sets whether the elevation is constrained to the positive half of the
   * rotation axis.
   * @param useHalfAxis
   */
  setUseHalfAxis(useHalfAxis: boolean): boolean;
}

export interface IMouseCameraAxisRotateManipulatorInitialValues
  extends
    ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {
  rotationAxis?: Vector3;
  useHalfAxis?: boolean;
}

export function newInstance(
  initialValues?: IMouseCameraAxisRotateManipulatorInitialValues
): vtkMouseCameraAxisRotateManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraAxisRotateManipulatorInitialValues
): void;

/**
 * Rotates the camera around a fixed axis passing through the manipulator
 * center: horizontal drags azimuth around that axis, vertical drags elevate
 * towards it.
 */
export declare const vtkMouseCameraAxisRotateManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraAxisRotateManipulator;
