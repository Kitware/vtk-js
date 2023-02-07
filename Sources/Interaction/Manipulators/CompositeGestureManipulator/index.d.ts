import vtkInteractorStyle from '../../../Rendering/Core/InteractorStyle';
import vtkRenderer from '../../..//Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';
import { Nullable } from '../../../types';

export interface vtkCompositeGestureManipulator {
  /**
   * Starts an interaction event.
   */
  startInteraction(): void;

  /**
   * Ends an interaction event.
   */
  endInteraction(): void;

  /**
   * Handles a start pinch gesture.
   * @param interactor
   * @param scale
   */
  onStartPinch(interactor: vtkRenderWindowInteractor, scale: number): void;

  /**
   * Handles a pinch gesture.
   * @param interactor
   * @param renderer
   * @param scale
   */
  onPinch(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    scale: number
  ): void;

  /**
   * Handles an end pinch gesture.
   * @param interactor
   */
  onEndPinch(interactor: vtkRenderWindowInteractor): void;

  /**
   * Handles a start rotate gesture.
   * @param interactor
   * @param rotation
   */
  onStartRotate(interactor: vtkRenderWindowInteractor, rotation: number): void;

  /**
   * Handles a rotate gesture.
   * @param interactor
   * @param renderer
   * @param rotation
   */
  onRotate(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    rotation: number
  ): void;

  /**
   * Handles an end pinch gesture.
   * @param interactor
   */
  onEndRotate(interactor: vtkRenderWindowInteractor): void;

  /**
   * Handles a start pan gesture.
   * @param interactor
   * @param translation
   */
  onStartPan(interactor: vtkRenderWindowInteractor, translation: number): void;

  /**
   * Handles a pan gesture.
   * @param interactor
   * @param renderer
   * @param translation
   */
  onPan(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    translation: number
  ): void;

  /**
   * Handles an end pan gesture.
   * @param interactor
   */
  onEndPan(interactor: vtkRenderWindowInteractor): void;

  /**
   * Is pinch enabled.
   */
  isPinchEnabled(): boolean;

  /**
   * Sets if pinch is enabled.
   * @param pinch
   */
  setPinchEnabled(pinch: boolean): boolean;

  /**
   * Gets flag if pinch is enabled.
   */
  getPinchEnabled(): boolean;

  /**
   * Is pan enabled.
   */
  isPanEnabled(): boolean;

  /**
   * Sets if pan is enabled.
   * @param pan
   */
  setPanEnabled(pan: boolean): boolean;

  /**
   * Gets flag if pan is enabled.
   */
  getPanEnabled(): boolean;

  /**
   * Is rotate enabled.
   */
  isRotateEnabled(): boolean;

  /**
   * Sets if rotate is enabled.
   * @param rotate
   */
  setRotateEnabled(rotate: boolean): boolean;

  /**
   * Gets flag if rotate is enabled.
   */
  getRotateEnabled(): boolean;

  /**
   * Sets the interactor style.
   * @param style vtkInteractorStyle
   */
  setInteractorStyle(style: Nullable<vtkInteractorStyle>): boolean;

  /**
   * Gets the interactor style.
   */
  getInteractorStyle(): Nullable<vtkInteractorStyle>;
}

export interface ICompositeGestureManipulatorInitialValues {
  pinchEnabled?: boolean;
  panEnabled?: boolean;
  rotateEnabled?: boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICompositeGestureManipulatorInitialValues
): void;

export const vtkCompositeGestureManipulator: {
  extend: typeof extend;
};

export default vtkCompositeGestureManipulator;
