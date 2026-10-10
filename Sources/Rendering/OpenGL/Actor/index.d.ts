import { Nullable } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkOpenGLTexture from '../Texture';

/**
 * The cached matrices recomputed whenever the renderable changes.
 */
export interface IOpenGLActorKeyMatrices {
  normalMatrix: Float64Array;
  mcwc: Float64Array;
}

export interface IOpenGLActorInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  activeTextures?: Nullable<vtkOpenGLTexture[]>;
}

export interface vtkOpenGLActor extends vtkViewNode {
  /**
   * Builds myself: resolve the render window, renderer and context, then adopt
   * the renderable's textures and mapper as children.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Render both opaque and translucent actors.
   * @param {vtkRenderPass} renderPass
   */
  traverseZBufferPass(renderPass: vtkRenderPass): void;

  /**
   * Render only opaque actors.
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
   * Render every child texture and keep the ones that produced a handle.
   */
  activateTextures(): void;

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
   * Recompute the model-to-world and normal matrices if the renderable moved.
   */
  getKeyMatrices(): IOpenGLActorKeyMatrices;

  /**
   * The textures activated by the last `activateTextures()` call.
   */
  getActiveTextures(): Nullable<vtkOpenGLTexture[]>;

  /**
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * @param context
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLActorInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLActor.
 * @param {IOpenGLActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLActorInitialValues
): vtkOpenGLActor;

/**
 * The OpenGL backend view node for a vtkActor.
 */
export declare const vtkOpenGLActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLActor;
