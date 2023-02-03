import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeGestureManipulator, {
  ICompositeGestureManipulatorInitialValues,
} from '../CompositeGestureManipulator';
import { vtkObject } from '../../../interfaces';
export interface vtkGestureCameraManipulator
  extends vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeGestureManipulator {}

export interface IGestureCameraManipulatorInitialValues
  extends ICompositeCameraManipulatorInitialValues,
    ICompositeGestureManipulatorInitialValues {
  flipDirection?: boolean;
}

export function newInstance(
  initialValues?: IGestureCameraManipulatorInitialValues
): vtkGestureCameraManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IGestureCameraManipulatorInitialValues
): void;

export const vtkGestureCameraManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkGestureCameraManipulator;
