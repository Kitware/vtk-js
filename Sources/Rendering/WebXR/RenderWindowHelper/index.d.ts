import { EventHandler, vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkOpenGLRenderWindow from '../../OpenGL/RenderWindow';
import vtkRenderWindow from '../../Core/RenderWindow';
import { XrSessionTypes } from './Constants';

/**
 *
 */
export interface IWebXRRenderWindowHelperInitialValues {
  initialized?: boolean;
  drawControllersRay?: boolean;
  initCanvasSize?: [number, number];
  initBackground?: [number, number, number, number];
  renderWindow?: Nullable<vtkOpenGLRenderWindow>;
  xrSession?: Nullable<XRSession>;
  xrSessionType?: number;
  xrReferenceSpace?: any;
}

export interface vtkWebXRRenderWindowHelper extends vtkObject {
  /**
   * Initialize the instance.
   */
  initialize(renderWindow: vtkRenderWindow): void;

  /**
   * Whether the browser exposes the WebXR device API.
   */
  getXrSupported(): boolean;

  /**
   * Request an XR session on the user device with WebXR,
   * typically in response to a user request such as a button press.
   */
  startXR(xrSessionType: number): void;

  /**
   * When an XR session is available, set up the XRWebGLLayer
   * and request the first animation frame for the device
   */
  enterXR(): void;

  /**
   * Adjust world-to-physical parameters for different viewing modalities
   *
   * @param {Number} inputRescaleFactor
   * @param {Number} inputTranslateZ
   */
  resetXRScene(inputRescaleFactor?: number, inputTranslateZ?: number): void;

  /**
   * Request to stop the current XR session
   */
  stopXR(): void;

  /**
   * Get the underlying render window to drive XR rendering.
   */
  getRenderWindow(): Nullable<vtkOpenGLRenderWindow>;

  /**
   * Set the underlying render window to drive XR rendering.
   */
  setRenderWindow(renderWindow: Nullable<vtkOpenGLRenderWindow>);

  /**
   * Get the active WebXR session.
   */
  getXrSession(): Nullable<XRSession>;

  /**
   * Whether a ray is drawn from each tracked-pointer controller.
   */
  getDrawControllersRay(): boolean;

  /**
   * Set whether a ray is drawn from each tracked-pointer controller.
   */
  setDrawControllersRay(drawControllersRay: boolean): boolean;

  /**
   * Subscribe to the generic event fired by this helper.
   */
  onEvent(cb: EventHandler, priority?: number): vtkSubscription;

  /**
   * Invoke the generic event fired by this helper.
   */
  invokeEvent(...args: unknown[]): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebXRRenderWindowHelper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebXRRenderWindowHelperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebXRRenderWindowHelperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebXRRenderWindowHelper.
 * @param {IWebXRRenderWindowHelperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebXRRenderWindowHelperInitialValues
): vtkWebXRRenderWindowHelper;

/**
 * WebXR rendering helper
 *
 * vtkWebXRRenderWindowHelper is designed to wrap a vtkRenderWindow for XR rendering.
 */
export declare const vtkWebXRRenderWindowHelper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  XrSessionTypes: typeof XrSessionTypes;
};
export default vtkWebXRRenderWindowHelper;
