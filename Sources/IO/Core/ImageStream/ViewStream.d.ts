import { vtkObject } from '../../../interfaces';
import { Size } from '../../../types';
import vtkCamera from '../../../Rendering/Core/Camera';
import DefaultProtocol from './DefaultProtocol';
/**
 *
 */
export interface IViewStreamInitialValues {
  protocol?: typeof DefaultProtocol;
  api?: any;
  cameraUpdateRate?: number;
  decodeImage?: boolean;
  fpsWindowSize?: number;
  interactiveQuality?: number;
  interactiveRatio?: number;
  isAnimating?: boolean;
  mimeType?: string;
  size?: Size;
  stillQuality?: number;
  stillRatio?: number;
  useCameraParameters?: boolean;
  viewId?: string;
}

interface IMetaData {
  size: Size,
  id: string,
  memory: number,
  workTime: number,
}

interface IEvent {
  url: string,
  fps: number[],
  metadata: IMetaData,
}

export interface vtkViewStream extends vtkObject {
  /**
   *
   * @param callback
   */
  onImageReady(callback: () => void): any;

  /**
   *
   */
  getViewId(): string;

  /**
   *
   */
  getSize(): Size;

  /**
   *
   */
  getFps(): number[];

  /**
   *
   */
  getLastImageEvent(): IEvent;

  /**
   *
   */
  getCamera(): vtkCamera;

  /**
   *
   * @param camera
   */
  setCamera(camera: vtkCamera): boolean;

  /**
   *
   */
  getCameraUpdateRate(): number;

  /**
   *
   * @param cameraUpdateRate
   */
  setCameraUpdateRate(cameraUpdateRate: number): boolean;

  /**
   *
   */
  getDecodeImage(): boolean;

  /**
   *
   * @param decodeImage
   */
  setDecodeImage(decodeImage: boolean): boolean;

  /**
   *
   */
  getFpsWindowSize(): number;

  /**
   *
   * @param fpsWindowSize
   */
  setFpsWindowSize(fpsWindowSize: number): boolean;

  /**
   *
   */
  getInteractiveQuality(): number;

  /**
   *
   * @param interactiveQuality
   */
  setInteractiveQuality(interactiveQuality: number): boolean;

  /**
   *
   */
  getInteractiveRatio(): number;

  /**
   *
   * @param interactiveRatio
   */
  setInteractiveRatio(interactiveRatio: number): boolean;

  /**
   *
   */
  getStillQuality(): number;

  /**
   *
   * @param stillQuality
   */
  setStillQuality(stillQuality: number): boolean;

  /**
   *
   */
  getStillRatio(): number;

  /**
   *
   * @param stillRatio
   */
  setStillRatio(stillRatio: number): boolean;

  /**
   *
   */
  getUseCameraParameters(): boolean;

  /**
   *
   * @param useCameraParameters
   */
  setUseCameraParameters(useCameraParameters: boolean): boolean;

  /**
   *
   */
  pushCamera(): any;

  /**
   *
   */
  invalidateCache(): any;

  /**
   *
   */
  render(): any;

  /**
   *
   */
  resetCamera(): any;

  /**
   *
   */
  startAnimation(): any;

  /**
   *
   */
  stopAnimation(): any;

  /**
   *
   * @param width
   * @param height
   */
  setSize(width: number, height: number): any;

  /**
   *
   */
  startInteraction(): any;

  /**
   *
   */
  endInteraction(): any;

  /**
   *
   * @param viewId
   */
  setViewId(viewId: string): boolean;

  /**
   *
   * @param msg
   */
  processMessage(msg: any): void;

  /**
   *
   */
  delete(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkViewStream characteristics.
 * @param publicAPI
 * @param model
 * @param initialValues
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IViewStreamInitialValues
): void;

/**
 * Method used to create a new instance of vtkViewStream
 * @param {IViewStreamInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IViewStreamInitialValues
): vtkViewStream;

/**
 * IViewStreamInitialValues provides a way to create a remote view.
 */
export declare const vtkViewStream: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkViewStream;
