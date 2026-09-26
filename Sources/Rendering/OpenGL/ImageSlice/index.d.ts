import { Nullable } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

/**
 * The cached model-to-world matrix, recomputed whenever the renderable changes.
 */
export interface IOpenGLImageSliceKeyMatrices {
  mcwc: Float64Array;
}

export interface IOpenGLImageSliceInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
}

export interface vtkOpenGLImageSlice extends vtkViewNode {
  /**
   * Builds myself: resolve the render window, renderer and context, then adopt
   * the renderable's mapper as a child.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseZBufferPass(renderPass: vtkRenderPass): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseOpaqueZBufferPass(renderPass: vtkRenderPass): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseOpaquePass(renderPass: vtkRenderPass): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseTranslucentPass(renderPass: vtkRenderPass): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  zBufferPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaqueZBufferPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Renders myself.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Renders myself.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  translucentPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Recompute the model-to-world matrix if the renderable moved.
   */
  getKeyMatrices(): IOpenGLImageSliceKeyMatrices;

  /**
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * @param context
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLImageSlice characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLImageSliceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLImageSliceInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLImageSlice.
 * @param {IOpenGLImageSliceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLImageSliceInitialValues
): vtkOpenGLImageSlice;

/**
 * The OpenGL backend view node for a vtkImageSlice.
 */
export declare const vtkOpenGLImageSlice: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLImageSlice;
