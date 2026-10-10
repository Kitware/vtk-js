import { vtkObject } from '../../../interfaces';
import { Vector4 } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { vtkWebGPURenderer } from '../Renderer';

/**
 * The cached matrices recomputed whenever the renderable or the stabilized
 * center of the renderer changes. Both are identity up to the buffer shift,
 * since a 2D actor is not transformed by its own matrix.
 */
export interface IWebGPUActor2DKeyMatrices {
  normalMatrix: Float64Array;
  bcwc: Float64Array;
  bcsc: Float64Array;
}

export interface IWebGPUActor2DInitialValues extends IViewNodeInitialValues {
  propID?: number;
}

export interface vtkWebGPUActor2D extends vtkViewNode {
  /**
   * Builds myself: resolve the renderer and render window, claim a prop id and
   * adopt the renderable's mapper as a child.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

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
   * The translation applied to the vertex buffers of this actor to keep them
   * near the origin. Recomputes the key matrices if needed.
   * @param {vtkWebGPURenderer} wgpuRen
   */
  getBufferShift(wgpuRen: vtkWebGPURenderer): Vector4;

  /**
   * Recompute the buffer to world/stabilized and normal matrices if the
   * renderable or the stabilized center moved.
   * @param {vtkWebGPURenderer} wgpuRen
   */
  getKeyMatrices(wgpuRen: vtkWebGPURenderer): IWebGPUActor2DKeyMatrices;

  /**
   * The identifier used by hardware selection to recognize this prop.
   */
  getPropID(): number;

  /**
   * The time stamp guarding the cached key matrices.
   */
  getKeyMatricesTime(): vtkObject;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUActor2D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUActor2DInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUActor2DInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUActor2D.
 * @param {IWebGPUActor2DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUActor2DInitialValues
): vtkWebGPUActor2D;

/**
 * The WebGPU backend view node for a vtkActor2D.
 */
export declare const vtkWebGPUActor2D: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUActor2D;
