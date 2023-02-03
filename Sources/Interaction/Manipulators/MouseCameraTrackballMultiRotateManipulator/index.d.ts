import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { vtkObject } from '../../../interfaces';
export interface vtkMouseCameraTrackballMultiRotateManipulator
  extends vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {}

export interface IMouseCameraTrackballMultiRotateManipulatorInitialValues
  extends ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {}

export function newInstance(
  initialValues?: IMouseCameraTrackballMultiRotateManipulatorInitialValues
): vtkMouseCameraTrackballMultiRotateManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraTrackballMultiRotateManipulatorInitialValues
): void;

export const vtkMouseCameraTrackballMultiRotateManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraTrackballMultiRotateManipulator;
