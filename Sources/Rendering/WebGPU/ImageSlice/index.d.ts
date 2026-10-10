import { vtkObject } from '../../../interfaces';
import { Vector4 } from '../../../types';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { vtkWebGPURenderer } from '../Renderer';

/**
 * The cached matrix built by `extend`, holding the model to world transform.
 */
export interface IWebGPUImageSliceKeyMatrices {
  mcwc: Float64Array;
}

export interface IWebGPUImageSliceInitialValues extends IViewNodeInitialValues {
  propID?: number;
}

export interface vtkWebGPUImageSlice extends vtkViewNode {
  /**
   * Builds myself: resolve the renderer and render window, claim a prop id and
   * adopt the renderable's mapper as a child.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * @param {vtkRenderPass} renderPass
   */
  traverseZBufferPass(renderPass: vtkRenderPass): void;

  /**
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
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * The translation applied to the vertex buffers of this slice to keep them
   * near the origin. Recomputes the key matrices if needed.
   * @param {vtkWebGPURenderer} wgpuRen
   */
  getBufferShift(wgpuRen: vtkWebGPURenderer): Vector4;

  /**
   * Recompute the key matrices if the renderable or the stabilized center
   * moved.
   * @param {vtkWebGPURenderer} wgpuRen
   */
  getKeyMatrices(wgpuRen: vtkWebGPURenderer): IWebGPUImageSliceKeyMatrices;

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
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUImageSlice characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUImageSliceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUImageSliceInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUImageSlice.
 * @param {IWebGPUImageSliceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUImageSliceInitialValues
): vtkWebGPUImageSlice;

/**
 * The WebGPU backend view node for a vtkImageSlice.
 */
export declare const vtkWebGPUImageSlice: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUImageSlice;
