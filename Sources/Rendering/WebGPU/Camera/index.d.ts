import { vtkObject } from '../../../interfaces';
import { Vector2 } from '../../../types';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { vtkWebGPURenderer } from '../Renderer';

/**
 * The cached camera matrices, recomputed whenever the camera, the renderer,
 * the render window or the stabilized center changes. `sc` denotes stabilized
 * coordinates, `vc` view coordinates and `pc` projection coordinates.
 */
export interface IWebGPUCameraKeyMatrices {
  normalMatrix: Float64Array;
  vcpc: Float64Array;
  pcsc: Float64Array;
  wcvc: Float64Array;
  scpc: Float64Array;
  scvc: Float64Array;
}

export interface IWebGPUCameraInitialValues extends IViewNodeInitialValues {
  keyMatrixTime?: vtkObject;
}

export interface vtkWebGPUCamera extends vtkViewNode {
  /**
   * Fill the given matrix with the WebGPU projection matrix, whose depth range
   * is [0, 1] rather than the OpenGL [-1, 1].
   * @param outMat the 4x4 matrix to write into
   * @param aspect the viewport aspect ratio
   * @param cRange the clipping range
   * @param windowCenter the normalized window center
   */
  getProjectionMatrix(
    outMat: Float64Array,
    aspect: number,
    cRange: Vector2,
    windowCenter: Vector2
  ): void;

  /**
   * Convert a WebGPU depth value into the equivalent OpenGL depth value.
   * @param val
   */
  convertToOpenGLDepth(val: number): number;

  /**
   * Recompute the view/projection matrices if the camera, the renderer, the
   * render window or the stabilized center changed since the last call.
   * @param {vtkWebGPURenderer} webGPURenderer
   */
  getKeyMatrices(webGPURenderer: vtkWebGPURenderer): IWebGPUCameraKeyMatrices;

  /**
   * The time stamp guarding the cached key matrices.
   */
  getKeyMatrixTime(): vtkObject;

  /**
   * @param keyMatrixTime
   */
  setKeyMatrixTime(keyMatrixTime: vtkObject): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUCamera characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUCameraInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUCameraInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUCamera.
 * @param {IWebGPUCameraInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUCameraInitialValues
): vtkWebGPUCamera;

/**
 * The WebGPU backend view node for a vtkCamera.
 */
export declare const vtkWebGPUCamera: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUCamera;
