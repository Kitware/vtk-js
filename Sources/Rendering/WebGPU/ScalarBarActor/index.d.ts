import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

export interface IWebGPUScalarBarActorInitialValues extends IViewNodeInitialValues {}

export interface vtkWebGPUScalarBarActor extends vtkViewNode {
  /**
   * Builds myself: bind the scalar bar helper to the renderable and adopt the
   * bar and text actors it owns as children.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Renders myself: hand the viewport size, the active camera and the render
   * window to the scalar bar helper.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUScalarBarActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUScalarBarActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUScalarBarActorInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUScalarBarActor.
 * @param {IWebGPUScalarBarActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUScalarBarActorInitialValues
): vtkWebGPUScalarBarActor;

/**
 * The WebGPU backend view node for a vtkScalarBarActor.
 */
export declare const vtkWebGPUScalarBarActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUScalarBarActor;
