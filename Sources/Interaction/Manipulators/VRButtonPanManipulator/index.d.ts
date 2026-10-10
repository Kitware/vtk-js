import vtkCompositeVRManipulator, {
  ICompositeVRManipulatorInitialValues,
} from '../CompositeVRManipulator';
import { vtkObject } from '../../../interfaces';

export interface vtkVRButtonPanManipulator
  extends vtkObject, vtkCompositeVRManipulator {}

export interface IVRButtonPanManipulatorInitialValues extends ICompositeVRManipulatorInitialValues {}

export function newInstance(
  initialValues?: IVRButtonPanManipulatorInitialValues
): vtkVRButtonPanManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IVRButtonPanManipulatorInitialValues
): void;

/**
 * Moves the world along the direction the VR controller points at, at a speed
 * driven by the controller's second gamepad axis, while the camera pose
 * interaction is active.
 */
export declare const vtkVRButtonPanManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkVRButtonPanManipulator;
