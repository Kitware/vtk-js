import vtkWebGPUDevice from '../Device';
import {
  IWebGPUFullScreenQuadInitialValues,
  vtkWebGPUFullScreenQuad,
} from '../FullScreenQuad';
import { vtkWebGPUPipeline } from '../Pipeline';
import {} from '../SimpleMapper';
import { vtkWebGPUVertexInput } from '../VertexInput';
import { vtkWebGPUVolume } from '../Volume';

export interface IWebGPUVolumePassFSQInitialValues extends IWebGPUFullScreenQuadInitialValues {
  volumes?: vtkWebGPUVolume[];
  colorRowLength?: number;
  opacityRowLength?: number;
  lastVolumeLength?: number;
}

export interface vtkWebGPUVolumePassFSQ extends vtkWebGPUFullScreenQuad {
  /**
   * Shader replacement, registered under `replaceShaderVolume`, generating the
   * ray marching loop, the per volume sampling and compositing code and the
   * transfer function lookups for every volume of the pass.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderVolume(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Set the volumes this quad ray casts, marking the mapper modified only when
   * the list actually changed.
   *
   * @param {vtkWebGPUVolume[]} val
   */
  setVolumes(val: vtkWebGPUVolume[]): void;

  /**
   * Rebuild the color and opacity transfer function textures of all volumes
   * when any of their transfer functions changed.
   *
   * @param {vtkWebGPUDevice} device
   */
  updateLUTImage(device: vtkWebGPUDevice): void;

  /**
   * Rebuild and send the storage buffers holding the per volume and per
   * component ray casting parameters.
   *
   * @param {vtkWebGPUDevice} device
   */
  updateSSBO(device: vtkWebGPUDevice): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUVolumePassFSQ characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUVolumePassFSQInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUVolumePassFSQInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUVolumePassFSQ.
 * @param {IWebGPUVolumePassFSQInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUVolumePassFSQInitialValues
): vtkWebGPUVolumePassFSQ;

/**
 * vtkWebGPUVolumePassFSQ is the full screen quad vtkWebGPUVolumePass ray casts
 * its volumes with. It generates the WGSL that marches through every volume of
 * a group between the min and max depth bounds, applying each volume's blend
 * mode, transfer functions, lighting and clipping planes.
 */
declare const vtkWebGPUVolumePassFSQ: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUVolumePassFSQ;
