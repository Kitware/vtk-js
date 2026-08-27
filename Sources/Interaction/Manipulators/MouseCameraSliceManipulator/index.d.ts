import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { vtkObject } from '../../../interfaces';

export interface vtkMouseCameraSliceManipulator
  extends
    vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {}

export interface IMouseCameraSliceManipulatorInitialValues
  extends
    ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {}

export function newInstance(
  initialValues?: IMouseCameraSliceManipulatorInitialValues
): vtkMouseCameraSliceManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraSliceManipulatorInitialValues
): void;

/**
 * Slices through a volume by moving the camera along its view direction,
 * clamped to the active camera clipping range.
 */
export declare const vtkMouseCameraSliceManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraSliceManipulator;
