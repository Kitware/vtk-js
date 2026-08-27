import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkRenderer from '../../Core/Renderer';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

/**
 * The cached camera matrices, recomputed whenever the camera, the renderer or
 * the render window changes.
 */
export interface IOpenGLCameraKeyMatrices {
  normalMatrix: Float64Array;
  vcpc: Float64Array;
  wcvc: Float64Array;
  wcpc: Float64Array;
}

export interface IOpenGLCameraInitialValues extends IViewNodeInitialValues {
  keyMatrixTime?: vtkObject;
  context?: Nullable<WebGL2RenderingContext>;
  lastRenderer?: Nullable<vtkRenderer>;
}

export interface vtkOpenGLCamera extends vtkViewNode {
  /**
   * Builds myself: resolve the renderer, render window and context.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Renders myself: set the viewport and scissor box from the renderer's tile.
   * @param prepass
   */
  opaquePass(prepass: boolean): void;

  /**
   * @param prepass
   */
  translucentPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  zBufferPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  volumePass(prepass: boolean): void;

  /**
   * Recompute the view/projection matrices if the camera, renderer or render
   * window changed since the last call.
   * @param {vtkRenderer} ren
   */
  getKeyMatrices(ren: vtkRenderer): IOpenGLCameraKeyMatrices;

  /**
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * @param context
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;

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
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLCamera characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLCameraInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLCameraInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLCamera.
 * @param {IOpenGLCameraInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLCameraInitialValues
): vtkOpenGLCamera;

/**
 * The OpenGL backend view node for a vtkCamera.
 */
export declare const vtkOpenGLCamera: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLCamera;
