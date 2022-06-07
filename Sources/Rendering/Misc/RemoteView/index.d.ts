import { vtkObject } from '../../../interfaces';
import vtkCanvasView from '../CanvasView';
import vtkViewStream from '../../../IO/Core/ImageStream/ViewStream';

interface IRemoteViewInitialValues {
  viewId?: string;
  interactiveQuality?: number;
  interactiveRatio?: number;
  stillQuality?: number;
  stillRatio?: number;
  rpcMouseEvent?: string;
  rpcGestureEvent?: any;
  rpcWheelEvent?: any;
  viewStream?: vtkViewStream;
}

export interface vtkRemoteView extends vtkObject {
  /**
   * Get container element
   */
  getContainer(): HTMLElement;

  /**
   *
   */
  getViewStream(): vtkViewStream;

  /**
   *
   */
  getCanvasView(): vtkCanvasView;

  /**
   *
   */
  getInteractor(): any;

  /**
   *
   */
  getInteractorStyle(): any;

  /**
   *
   */
  getInteractiveQuality(): number;

  /**
   *
   */
  getInteractiveRatio(): number;

  /**
   *
   */
  getStillQuality(): number;

  /**
   *
   */
  getStillRatio(): number;

  /**
   *
   */
  getSession(): any;

  /**
   *
   * @param session
   */
  setSession(session: any): boolean;

  /**
   *
   */
  getRpcMouseEvent(): string;

  /**
   *
   * @param rpcMouseEvent
   */
  setRpcMouseEvent(rpcMouseEvent: string): boolean;

  /**
   *
   */
  getRpcGestureEvent(): any;

  /**
   *
   * @param rpcGestureEvent
   */
  setRpcGestureEvent(rpcGestureEvent: any): boolean;

  /**
   *
   */
  getRpcWheelEvent(): any;

  /**
   *
   * @param rpcWheelEvent
   */
  setRpcWheelEvent(rpcWheelEvent: any): boolean;

  /**
   * Release GL context
   */
  delete(): void;

  /**
   *
   * @param viewStream
   */
  setViewStream(viewStream: vtkViewStream): boolean;

  /**
   *
   * @param viewId
   */
  setViewId(viewId: string): void;

  /**
   *
   * @param {HTMLElement} container The container HTML element.
   */
  setContainer(container: HTMLElement): boolean;

  /**
   * Handle window resize
   */
  resize(): void;

  /**
   *
   */
  render(): void;

  /**
   *
   */
  resetCamera(): void;

  /**
   *
   * @param interactiveQuality
   */
  setInteractiveQuality(interactiveQuality: number): boolean;

  /**
   *
   * @param interactiveRatio
   */
  setInteractiveRatio(interactiveRatio: number): boolean;

  /**
   *
   * @param stillQuality
   */
  setStillQuality(stillQuality: number): boolean;

  /**
   *
   * @param stillRatio
   */
  setStillRatio(stillRatio: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRemoteView characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRemoteViewInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRemoteViewInitialValues
): void;

/**
 * Method used to create a new instance of vtkCanvasView
 * @param {IRemoteViewInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IRemoteViewInitialValues
): vtkRemoteView;

export function connectImageStream(session: any): any;
/**
 * vtkRemoteView provides a way to create a remote view.
 */
export declare const vtkRemoteView: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  connectImageStream: typeof connectImageStream;
};
export default vtkRemoteView;
