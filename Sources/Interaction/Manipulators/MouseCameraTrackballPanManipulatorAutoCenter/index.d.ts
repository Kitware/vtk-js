import vtkMouseCameraTrackballPanManipulator, {
  IMouseCameraTrackballPanManipulatorInitialValues,
} from '../MouseCameraTrackballPanManipulator';

export interface vtkMouseCameraTrackballPanManipulatorAutoCenter extends vtkMouseCameraTrackballPanManipulator {}

export interface IMouseCameraTrackballPanManipulatorAutoCenterInitialValues extends IMouseCameraTrackballPanManipulatorInitialValues {}

export function newInstance(
  initialValues?: IMouseCameraTrackballPanManipulatorAutoCenterInitialValues
): vtkMouseCameraTrackballPanManipulatorAutoCenter;

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMouseCameraTrackballPanManipulatorAutoCenterInitialValues
): void;

/**
 * Pan manipulator that moves the center of rotation along with the camera, so
 * that a subsequent rotation keeps orbiting the point the pan ended on. The
 * new center is pushed both to the manipulator and, when it exposes
 * `setCenterOfRotation`, to the interactor style.
 */
export declare const vtkMouseCameraTrackballPanManipulatorAutoCenter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkMouseCameraTrackballPanManipulatorAutoCenter;
