import { Nullable } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import vtkOpenGLTexture from '../Texture';

export interface IOpenGLSkyboxInitialValues extends IViewNodeInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
}

export interface vtkOpenGLSkybox extends vtkViewNode {
  /**
   * Builds myself: resolve the renderer, render window and context, and bind
   * the helper and cube map texture to that render window.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Renders myself: draw the full screen quad with the skybox shader.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Build the quad's vertex buffer, (re)compile the shader for the current
   * skybox format and pick up the renderable's texture.
   */
  updateBufferObjects(): void;

  /**
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
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLSkybox characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLSkyboxInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLSkyboxInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLSkybox.
 * @param {IOpenGLSkyboxInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLSkyboxInitialValues
): vtkOpenGLSkybox;

/**
 * The OpenGL backend view node for a vtkSkybox.
 */
export declare const vtkOpenGLSkybox: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLSkybox;
