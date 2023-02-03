import vtkMouseCameraTrackballZoomManipulator, {
  IMouseCameraTrackballZoomManipulatorInitialValues,
} from '../MouseCameraTrackballZoomManipulator';

export type vtkMouseCameraTrackballZoomToMouseManipulator =
  vtkMouseCameraTrackballZoomManipulator;

export type IMouseCameraTrackballZoomToMouseManipulatorInitialValues =
  IMouseCameraTrackballZoomManipulatorInitialValues;

export function newInstance(
  initialValues?: IMouseCameraTrackballZoomToMouseManipulatorInitialValues
): vtkMouseCameraTrackballZoomToMouseManipulator;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraTrackballZoomToMouseManipulatorInitialValues
): void;

export const vtkMouseCameraTrackballZoomToMouseManipulator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraTrackballZoomToMouseManipulator;
