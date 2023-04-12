import vtkInteractorStyle from '../../../Rendering/Core/InteractorStyle';
import vtkRenderer from '../../../Rendering/Core/Renderer';

export interface vtkInteractorStyleTrackballCamera extends vtkInteractorStyle {
  /**
   * Handles a mouse move.
   * @param callData event data
   */
  handleMouseMove(callData: unknown): void;

  /**
   * Handles a 3D button event.
   * @param callData event data
   */
  handleButton3D(ed: unknown): void;

  /**
   * Handles a 3D move event.
   * @param ed event data
   */
  handleMove3D(ed: unknown): void;

  /**
   * Update camera pose
   * @param ed event data
   */
  updateCameraPose(ed: unknown): void;

  /**
   * Handles a left button press event.
   * @param callData event data
   */
  handleLeftButtonPress(callData: unknown): void;

  /**
   * Handles a left button release event.
   * @param callData event data
   */
  handleLeftButtonRelease(callData: unknown): void;

  /**
   * Handles the start of a wheel event.
   * @param callData event data
   */
  handleStartMouseWheel(callData: unknown): void;

  /**
   * Handles the end of a wheel event.
   * @param callData event data
   */
  handleEndMouseWheel(callData: unknown): void;

  /**
   * Handles the start of a pinch gesture.
   * @param callData event data
   */
  handleStartPinch(callData: unknown): void;

  /**
   * Handles the end of a pinch gesture.
   * @param callData event data
   */
  handleEndPinch(callData: unknown): void;

  /**
   * Handles the start of a rotate gesture.
   * @param callData event data
   */
  handleStartRotate(callData: unknown): void;

  /**
   * Handles the end of a rotate gesture.
   * @param callData event data
   */
  handleEndRotate(callData: unknown): void;

  /**
   * Handles the start of a pan gesture.
   * @param callData event data
   */
  handleStartPan(callData: unknown): void;

  /**
   * Handles the end of a pan gesture.
   * @param callData event data
   */
  handleEndPan(callData: unknown): void;

  /**
   * Handles a pinch gesture.
   * @param callData event data
   */
  handlePinch(callData: unknown): void;

  /**
   * Handles a pan gesture.
   * @param callData event data
   */
  handlePan(callData: unknown): void;

  /**
   * Handles a rotate gesture.
   * @param callData event data
   */
  handleRotate(callData: unknown): void;

  /**
   * Handles rotate with a mouse.
   * @param renderer the renderer
   * @param position the display position
   */
  handleMouseRotate(renderer: vtkRenderer, position: { x: number, y: number }): void;

  /**
   * Handles spin with a mouse.
   * @param renderer the renderer
   * @param position the display position
   */
  handleMouseSpin(renderer: vtkRenderer, position: { x: number, y: number }): void;

  /**
   * Handles pan with a mouse.
   * @param renderer the renderer
   * @param position the display position
   */
  handleMousePan(renderer: vtkRenderer, position: { x: number, y: number }): void;

  /**
   * Handles dolly with a mouse.
   * @param renderer the renderer
   * @param position the display position
   */
  handleMouseDolly(renderer: vtkRenderer, position: { x: number, y: number }): void;

  /**
   * Handles a wheel event.
   * @param callData event data
   */
  handleMouseWheel(callData: unknown): void;

  /**
   * Dolly by factor.
   * @param renderer the renderer
   * @param factor factor
   */
  dollyByFactor(renderer: vtkRenderer, factor: number): void;
}

export interface IInteractorStyleTrackballCameraInitialValues {
  motionFactor: number;
  zoomFactor: number;
}

export function newInstance(
  initialValues?: IInteractorStyleTrackballCameraInitialValues
): vtkInteractorStyleTrackballCamera;


export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IInteractorStyleTrackballCameraInitialValues
): void;

export const vtkInteractorStyleTrackballCamera: {
  newInstance: typeof newInstance;
  extend: typeof extend;
}

export default vtkInteractorStyleTrackballCamera;
