import vtkCompositeCameraManipulator, {
  ICompositeCameraManipulatorInitialValues,
} from '../CompositeCameraManipulator';
import vtkCompositeMouseManipulator, {
  ICompositeMouseManipulatorInitialValues,
} from '../CompositeMouseManipulator';
import { vtkObject } from '../../../interfaces';
export interface vtkMouseCameraTrackballZoomManipulator
  extends vtkObject,
    vtkCompositeCameraManipulator,
    vtkCompositeMouseManipulator {
  /**
   * Sets whether to flip the zoom direction.
   * @param flip
   */
  setFlipDirection(flip: boolean): boolean;

  /**
   * Gets the flip direction.
   */
  getFlipDirection(): boolean;
}

export interface IMouseCameraTrackballZoomManipulatorInitialValues
  extends ICompositeCameraManipulatorInitialValues,
    ICompositeMouseManipulatorInitialValues {
  flipDirection?: boolean;
}

export function newInstance(
  initialValues?: IMouseCameraTrackballZoomManipulatorInitialValues
): vtkMouseCameraTrackballZoomManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraTrackballZoomManipulatorInitialValues
): void;

export const vtkMouseCameraTrackballZoomManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraTrackballZoomManipulator;
