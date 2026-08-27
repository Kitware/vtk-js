import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

export interface IWebGPUCubeAxesActorInitialValues extends IViewNodeInitialValues {}

export interface vtkWebGPUCubeAxesActor extends vtkViewNode {
  /**
   * Builds myself: bind the cube axes helper to the renderable and adopt the
   * text actor and the renderable's grid actor as children.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Renders myself: hand the viewport size, the active camera and the render
   * window to the cube axes helper.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  opaquePass(prepass: boolean, renderPass: vtkRenderPass): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUCubeAxesActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUCubeAxesActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUCubeAxesActorInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUCubeAxesActor.
 * @param {IWebGPUCubeAxesActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUCubeAxesActorInitialValues
): vtkWebGPUCubeAxesActor;

/**
 * The WebGPU backend view node for a vtkCubeAxesActor.
 */
export declare const vtkWebGPUCubeAxesActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUCubeAxesActor;
