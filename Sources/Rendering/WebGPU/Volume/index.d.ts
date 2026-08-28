import { vtkObject } from '../../../interfaces';
import { vtkRenderPass } from '../../SceneGraph/RenderPass';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { vtkWebGPURenderer } from '../Renderer';

/**
 * The cached matrices recomputed whenever the renderable or the stabilized
 * center of the renderer changes.
 */
export interface IWebGPUVolumeKeyMatrices {
  bcwc: Float64Array;
  bcsc: Float64Array;
}

export interface IWebGPUVolumeInitialValues extends IViewNodeInitialValues {
  propID?: number;
}

export interface vtkWebGPUVolume extends vtkViewNode {
  /**
   * Builds myself: resolve the renderer and render window, claim a prop id and
   * update the renderable's mapper.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Register myself with the render pass so that the volume pass can render me.
   * @param prepass
   * @param {vtkRenderPass} renderPass
   */
  queryPass(prepass: boolean, renderPass: vtkRenderPass): void;

  /**
   * Write the eight world space corners of the volume's spatial extent into
   * `result`, three components per point, starting at `offset`.
   * @param result the array to write into
   * @param offset the index of the first component to write
   */
  getBoundingCubePoints(result: Float64Array | number[], offset: number): void;

  /**
   * Recompute the buffer to world/stabilized matrices if the renderable or the
   * stabilized center moved.
   * @param {vtkWebGPURenderer} wgpuRen
   */
  getKeyMatrices(wgpuRen: vtkWebGPURenderer): IWebGPUVolumeKeyMatrices;

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
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUVolume characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUVolumeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUVolumeInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUVolume.
 * @param {IWebGPUVolumeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUVolumeInitialValues
): vtkWebGPUVolume;

/**
 * The WebGPU backend view node for a vtkVolume.
 */
export declare const vtkWebGPUVolume: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUVolume;
