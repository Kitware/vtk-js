import { Nullable } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

/**
 * The cached matrices recomputed whenever the renderable changes.
 */
export interface IOpenGLVolumeKeyMatrices {
  mcwc: Float64Array;
  normalMatrix: Float64Array;
}

export interface IOpenGLVolumeInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
}

export interface vtkOpenGLVolume extends vtkViewNode {
  /**
   * Builds myself: resolve the render window, renderer and context, then adopt
   * the renderable's mapper as a child.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseVolumePass(renderPass: vtkRenderPass): void;

  /**
   * Renders myself.
   * @param prepass
   */
  volumePass(prepass: boolean): void;

  /**
   * Recompute the model-to-world and normal matrices if the renderable moved.
   */
  getKeyMatrices(): IOpenGLVolumeKeyMatrices;

  /**
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * @param context
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLVolume characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLVolumeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLVolumeInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLVolume.
 * @param {IOpenGLVolumeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLVolumeInitialValues
): vtkOpenGLVolume;

/**
 * The OpenGL backend view node for a vtkVolume.
 */
export declare const vtkOpenGLVolume: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLVolume;
