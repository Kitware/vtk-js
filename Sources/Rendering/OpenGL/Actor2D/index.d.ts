import { Nullable } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkOpenGLTexture from '../Texture';

export interface IOpenGLActor2DInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  activeTextures?: Nullable<vtkOpenGLTexture[]>;
}

export interface vtkOpenGLActor2D extends vtkViewNode {
  /**
   * Builds myself: resolve the render window, renderer and context, then adopt
   * the renderable's textures and mapper as children.
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
  traverseOpaquePass(renderPass: vtkRenderPass): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseTranslucentPass(renderPass: vtkRenderPass): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseOverlayPass(renderPass: vtkRenderPass): void;

  /**
   * Render every child texture and keep the ones that produced a handle.
   */
  activateTextures(): void;

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
   * Renders myself.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  overlayPass(prepass: boolean, renderPass: vtkRenderPass): void;

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
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLActor2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLActor2DInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLActor2DInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLActor2D.
 * @param {IOpenGLActor2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLActor2DInitialValues
): vtkOpenGLActor2D;

/**
 * The OpenGL backend view node for a vtkActor2D.
 */
export declare const vtkOpenGLActor2D: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLActor2D;
