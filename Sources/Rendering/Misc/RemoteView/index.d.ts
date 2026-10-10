import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkCanvasView from '../CanvasView';
import vtkImageStream from '../../../IO/Core/ImageStream';
import vtkViewStream from '../../../IO/Core/ImageStream/ViewStream';
import vtkRenderWindowInteractor from '../../Core/RenderWindowInteractor';
import vtkInteractorStyleRemoteMouse from '../../../Interaction/Style/InteractorStyleRemoteMouse';

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
  canvasElement?: HTMLCanvasElement;
}

export interface vtkRemoteView extends vtkObject {
  /**
   * Get container HTML element
   */
  getContainer(): HTMLElement | undefined;

  /**
   * Get vtkViewStream object
   */
  getViewStream(): vtkViewStream | undefined;

  /**
   * Get the canvas HTML element
   */
  getCanvasElement(): HTMLCanvasElement;

  /**
   * Get the vtkCanvasView object
   */
  getCanvasView(): vtkCanvasView;

  /**
   *
   */
  getInteractor(): vtkRenderWindowInteractor;

  /**
   *
   */
  getInteractorStyle(): vtkInteractorStyleRemoteMouse;

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
  getRpcGestureEvent(): Nullable<string>;

  /**
   *
   * @param rpcGestureEvent
   */
  setRpcGestureEvent(rpcGestureEvent: Nullable<string>): boolean;

  /**
   *
   */
  getRpcWheelEvent(): Nullable<string>;

  /**
   *
   * @param rpcWheelEvent
   */
  setRpcWheelEvent(rpcWheelEvent: Nullable<string>): boolean;

  /**
   * Release GL context
   */
  delete(): void;

  /**
   *
   * @param viewStream
   */
  setViewStream(viewStream: vtkViewStream): void;

  /**
   *
   * @param viewId
   */
  setViewId(viewId: string): void;

  /**
   *
   * @param {HTMLElement} container The container HTML element.
   */
  setContainer(container: HTMLElement): void;

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

export function connectImageStream(session: any, protocol?: any): void;

export function disconnectImageStream(): void;

/**
 * vtkRemoteView provides a way to create a remote view.
 */
export declare const vtkRemoteView: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  SHARED_IMAGE_STREAM: vtkImageStream;
  connectImageStream: typeof connectImageStream;
  disconnectImageStream: typeof disconnectImageStream;
};
export default vtkRemoteView;
