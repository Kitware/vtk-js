import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';

export interface IOpenGLCubeAxesActorInitialValues extends IViewNodeInitialValues {}

export interface vtkOpenGLCubeAxesActor extends vtkViewNode {
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
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLCubeAxesActor characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLCubeAxesActorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLCubeAxesActorInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLCubeAxesActor.
 * @param {IOpenGLCubeAxesActorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLCubeAxesActorInitialValues
): vtkOpenGLCubeAxesActor;

/**
 * The OpenGL backend view node for a vtkCubeAxesActor.
 */
export declare const vtkOpenGLCubeAxesActor: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLCubeAxesActor;
