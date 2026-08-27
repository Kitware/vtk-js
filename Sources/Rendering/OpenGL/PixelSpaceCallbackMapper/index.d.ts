import vtkRenderPass from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

/**
 * Initial values for creating a new instance of vtkOpenGLPixelSpaceCallbackMapper.
 */
export interface IOpenGLPixelSpaceCallbackMapperInitialValues extends IViewNodeInitialValues {}

export interface vtkOpenGLPixelSpaceCallbackMapper extends vtkViewNode {
  /**
   * Invoke the renderable's callback with the current camera, aspect ratio,
   * viewport size and, when z values were requested, the depth texels.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Ask the render pass for a depth buffer when the renderable needs z values.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLPixelSpaceCallbackMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLPixelSpaceCallbackMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLPixelSpaceCallbackMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLPixelSpaceCallbackMapper.
 * @param {IOpenGLPixelSpaceCallbackMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLPixelSpaceCallbackMapperInitialValues
): vtkOpenGLPixelSpaceCallbackMapper;

/**
 * The OpenGL backend view node for vtkPixelSpaceCallbackMapper.
 */
export declare const vtkOpenGLPixelSpaceCallbackMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkOpenGLPixelSpaceCallbackMapper;
