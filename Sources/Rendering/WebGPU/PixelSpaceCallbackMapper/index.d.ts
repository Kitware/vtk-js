import vtkRenderPass from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

export interface IWebGPUPixelSpaceCallbackMapperInitialValues extends IViewNodeInitialValues {}

export interface vtkWebGPUPixelSpaceCallbackMapper extends vtkViewNode {
  /**
   * Invoke the callback of the renderable with the input data, the active
   * camera, the aspect ratio and the tiled size and origin of the renderer.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUPixelSpaceCallbackMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUPixelSpaceCallbackMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUPixelSpaceCallbackMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUPixelSpaceCallbackMapper.
 * @param {IWebGPUPixelSpaceCallbackMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUPixelSpaceCallbackMapperInitialValues
): vtkWebGPUPixelSpaceCallbackMapper;

/**
 * The WebGPU view node of vtkPixelSpaceCallbackMapper. It draws nothing, it
 * only hands the pixel space information to the renderable's callback.
 */
export declare const vtkWebGPUPixelSpaceCallbackMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUPixelSpaceCallbackMapper;
