import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkRenderWindow from '../../../Rendering/Core/RenderWindow';

export interface IFPSMonitorInitialValues {
  bufferSize?: number;
  graphHeight?: number;
  buffer?: number[];
  fpsSum?: number;
  /**
   * CSS class applied to the monitor container to lay it out horizontally or
   * vertically.
   */
  orientationClass?: string;
  canvasVisibility?: boolean;
  titleVisibility?: boolean;
  infoVisibility?: boolean;
}

export interface vtkFPSMonitor extends vtkObject {
  /**
   * Root element of the monitor.
   */
  getFpsMonitorContainer(): HTMLElement;

  getRenderWindow(): Nullable<vtkRenderWindow>;

  /**
   * Extra key/value pairs merged into the render window statistics listing.
   */
  getAddOnStats(): Nullable<Record<string, number>>;

  getBufferSize(): number;

  setBufferSize(bufferSize: number): boolean;

  getCanvasVisibility(): boolean;

  setCanvasVisibility(canvasVisibility: boolean): boolean;

  getInfoVisibility(): boolean;

  setInfoVisibility(infoVisibility: boolean): boolean;

  getTitleVisibility(): boolean;

  setTitleVisibility(titleVisibility: boolean): boolean;

  /**
   * Redraw the title, the statistics listing and the graph.
   */
  render(): void;

  /**
   * Alias of render().
   */
  update(): void;

  /**
   * Listen to the animation events of the render window interactor to sample
   * the frame rate. Passing null unsubscribes.
   * @param rw
   */
  setRenderWindow(rw: Nullable<vtkRenderWindow>): void;

  /**
   * Attach the monitor to the given DOM element, detaching it from any
   * previously set one.
   * @param el
   */
  setContainer(el: Nullable<HTMLElement>): void;

  /**
   * No-op kept for API symmetry with the other UI widgets.
   */
  resize(): void;

  setOrientationToHorizontal(): void;

  setOrientationToVertical(): void;

  /**
   * Any mode other than 'horizontal' selects the vertical layout.
   * @param {String} [mode] (default: 'horizontal')
   */
  setOrientation(mode?: 'horizontal' | 'vertical'): void;

  /**
   * Merge extra statistics into the ones reported by the render window.
   * @param addOn
   */
  setAddOnStats(addOn: Record<string, number>): void;

  /**
   * @param {Boolean} [title] (default: true)
   * @param {Boolean} [graph] (default: true)
   * @param {Boolean} [info] (default: true)
   */
  setMonitorVisibility(title?: boolean, graph?: boolean, info?: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkFPSMonitor
 * characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFPSMonitorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IFPSMonitorInitialValues
): void;

/**
 * Method used to create a new instance of vtkFPSMonitor.
 * @param {IFPSMonitorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IFPSMonitorInitialValues
): vtkFPSMonitor;

/**
 * vtkFPSMonitor is a DOM overlay reporting the mean and current frame rate of
 * a render window, a rolling graph of the last frames and the render window
 * statistics.
 */
export declare const vtkFPSMonitor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkFPSMonitor;
