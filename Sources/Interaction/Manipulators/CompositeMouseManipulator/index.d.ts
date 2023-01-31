import vtkRenderer from '../../../Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Rendering/Core/RenderWindowInteractor';

export interface vtkCompositeMouseManipulator {
  /**
   * Starts an interaction event.
   */
  startInteraction(): void;

  /**
   * Ends an interaction event.
   */
  endInteraction(): void;

  /**
   * Handles a button down event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param position the display position
   */
  onButtonDown(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handles a button up event.
   * @param interactor the interactor
   */
  onButtonUp(interactor: vtkRenderWindowInteractor): void;

  /**
   * Handles a mouse move event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param position the display position
   */
  onMouseMove(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    position: { x: number; y: number }
  ): void;

  /**
   * Handles a start scroll event.
   * @param interactor the interactor
   * @param renderer the renderer
   * @param delta the scroll delta
   */
  onStartScroll(
    interactor: vtkRenderWindowInteractor,
    renderer: vtkRenderer,
    delta: number
  ): void;

  /**
   * Handles a scroll event.
   * @param interactor the interactor
   */
  onEndScroll(interactor: vtkRenderWindowInteractor): void;

  /**
   * Is drag enabled.
   */
  isDragEnabled(): boolean;

  /**
   * Sets if drag is enabled.
   * @param enabled
   */
  setDragEnabled(enabled: boolean): boolean;

  /**
   * Is scroll enabled.
   */
  isScrollEnabled(): boolean;

  /**
   * Sets if scroll is enabled.
   * @param enabled
   */
  setScrollEnabled(enabled: boolean): boolean;

  /**
   * Sets the associated button.
   * @param btn
   */
  setButton(btn: number): boolean;

  /**
   * Gets the associated button.
   */
  getButton(): number;

  /**
   * Sets if the shift key is required.
   * @param shift
   */
  setShift(shift: boolean): boolean;

  /**
   * Gets flag if shift key is required.
   */
  getShift(): boolean;

  /**
   * Sets if the control key is required.
   * @param ctrl
   */
  setControl(ctrl: boolean): boolean;

  /**
   * Gets flag if control key is required.
   */
  getControl(): boolean;

  /**
   * Sets if the alt key is required.
   * @param alt
   */
  setAlt(alt: boolean): boolean;

  /**
   * Gets flag if alt key is required.
   */
  getAlt(): boolean;
}

export interface ICompositeMouseManipulatorInitialValues {
  button?: number;
  shift?: boolean;
  control?: boolean;
  alt?: boolean;
  dragEnabled?: boolean;
  scrollEnabled?: boolean;
}

export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ICompositeMouseManipulatorInitialValues
): void;

export const vtkCompositeMouseManipulator: {
  extend: typeof extend;
};

export default vtkCompositeMouseManipulator;
