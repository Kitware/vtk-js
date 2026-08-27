import { Nullable } from '../../../types';
import { vtkImageData } from '../../../Common/DataModel/ImageData';
import { vtkPolyData } from '../../../Common/DataModel/PolyData';
import { ICoincidentTopology } from '../../Core/Mapper/CoincidentTopologyHelper';
import { vtkWebGPUPipeline } from '../Pipeline';
import { vtkWebGPUSampler } from '../Sampler';
import {
  IWebGPUSimpleMapperInitialValues,
  vtkWebGPUSimpleMapper,
} from '../SimpleMapper';

export interface IWebGPUImageCPRMapperInitialValues extends IWebGPUSimpleMapperInitialValues {
  rowLength?: number;
  currentImageDataInput?: Nullable<vtkImageData>;
  currentCenterlineInput?: Nullable<vtkPolyData>;
  colorTextureString?: Nullable<string>;
  pwfTextureString?: Nullable<string>;
  cprSampler?: Nullable<vtkWebGPUSampler>;
}

export interface vtkWebGPUImageCPRMapper extends vtkWebGPUSimpleMapper {
  /**
   * Resolve the ancestors this mapper renders with and bind it to its
   * renderer.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  buildPass(prepass: boolean): void;

  /**
   * Get the polygon offset the renderable asks for, or `null` when it does not
   * resolve coincident topology with a polygon offset.
   */
  getCoincidentParameters(): Nullable<ICoincidentTopology>;

  /**
   * Render the reformat during the opaque pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaquePass(prepass: boolean): void;

  /**
   * Capture the reformat depth during the opaque z-buffer pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Render the reformat.
   */
  render(): void;

  /**
   * Shader replacement, registered under `replaceShaderClip`, emitting the
   * clipping plane test in model coordinates.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   */
  replaceShaderClip(hash: string, pipeline: vtkWebGPUPipeline): void;

  /**
   * Shader replacement, registered under `replaceShaderCoincident`, emitting
   * the depth offset the renderable's coincident topology resolution asks for.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   */
  replaceShaderCoincident(hash: string, pipeline: vtkWebGPUPipeline): void;

  /**
   * Shader replacement, registered under `replaceShaderImageCPR`, emitting the
   * quad positions along the centerline and the volume sampling that straightens
   * the image.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   */
  replaceShaderImageCPR(hash: string, pipeline: vtkWebGPUPipeline): void;

  /**
   * Shader replacement, registered under `replaceShaderRenderEncoder`, writing
   * the prop identifier when the encoder is the hardware selector's.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   */
  replaceShaderRenderEncoder(hash: string, pipeline: vtkWebGPUPipeline): void;

  /**
   * Render the reformat during the translucent pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  translucentPass(prepass: boolean): void;

  /**
   * Build or reuse the texture holding the sampled color transfer functions.
   */
  updateColorTexture(): void;

  /**
   * Rebuild the quad strip following the centerline, one quad per centerline
   * segment, with its positions, orientations and distances.
   */
  updateGeometry(): void;

  /**
   * Build or reuse the texture holding the sampled piecewise opacity
   * functions.
   */
  updateOpacityTexture(): void;

  /**
   * Recompute and send the mapper uniform buffer when the renderable, the
   * actor, the property, the image or the stabilized center changed.
   */
  updateUBO(): void;

  /**
   * Bind a texture view of the input image as the volume this mapper samples.
   */
  updateVolumeTexture(): void;

  /**
   * Render the reformat depth only, so that a later pass can mix geometry with
   * volumes.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  zBufferPass(prepass: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUImageCPRMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUImageCPRMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUImageCPRMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUImageCPRMapper.
 * @param {IWebGPUImageCPRMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUImageCPRMapperInitialValues
): vtkWebGPUImageCPRMapper;

/**
 * vtkWebGPUImageCPRMapper is the WebGPU scene graph node that draws a
 * vtkImageSlice whose mapper is a vtkImageCPRMapper. It builds a quad strip
 * along the oriented centerline and assembles the WGSL that samples the volume
 * along each quad, producing a curved planar reformat.
 *
 * Importing this module registers it as the WebGPU override for
 * `vtkImageCPRMapper`.
 */
declare const vtkWebGPUImageCPRMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUImageCPRMapper;
