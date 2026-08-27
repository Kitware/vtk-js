/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import { ICoincidentTopology } from '../../Core/Mapper/CoincidentTopologyHelper';
import { vtkImageProperty } from '../../Core/ImageProperty';
import {
  IWebGPUFullScreenQuadInitialValues,
  vtkWebGPUFullScreenQuad,
} from '../FullScreenQuad';
import { vtkWebGPUPipeline } from '../Pipeline';
import {} from '../SimpleMapper';
import { vtkWebGPUTextureView } from '../TextureView';
import { vtkWebGPUVertexInput } from '../VertexInput';
import { TextureChannelMode } from './Constants';

/**
 * How the scalars of the image being rendered map onto the texture channels,
 * and which of the property's transfer functions apply to them.
 */
export interface IWebGPUImageState {
  actorProperty: vtkImageProperty;
  numberOfComponents: number;
  independentComponents: boolean;
  numberOfIComponents: number;
  useLabelOutline: boolean;
  textureChannelMode: TextureChannelMode;
}

export interface IWebGPUImageMapperInitialValues extends IWebGPUFullScreenQuadInitialValues {
  imageState?: Nullable<IWebGPUImageState>;
  rowLength?: number;
}

export interface vtkWebGPUImageMapper extends vtkWebGPUFullScreenQuad {
  /**
   * Resolve the ancestors this mapper renders with and, when the renderable
   * slices at the focal point, move its slice to the active camera.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  buildPass(prepass: boolean): void;

  /**
   * Compute how the image scalars map onto the texture channels from the
   * property and the image texture currently bound.
   */
  computeImageState(): IWebGPUImageState;

  /**
   * Give the texture view a sampler matching the given options, unless the
   * sampler it already has matches them.
   *
   * @param {vtkWebGPUTextureView} textureView
   * @param {GPUSamplerDescriptor} options
   */
  ensureTextureSampler(
    textureView: Nullable<vtkWebGPUTextureView>,
    options: GPUSamplerDescriptor
  ): void;

  /**
   * Get the polygon offset the renderable asks for, or a zero offset when it
   * does not resolve coincident topology with a polygon offset.
   */
  getCoincidentParameters(): ICoincidentTopology;

  /**
   * Get the image state computed by the last `updateBuffers`, recomputing it
   * when the buffers have not been updated yet.
   */
  getImageState(): IWebGPUImageState;

  /**
   * Render the slice during the opaque pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaquePass(prepass: boolean): void;

  /**
   * Capture the slice depth during the opaque z-buffer pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Render the slice.
   */
  render(): void;

  /**
   * Shader replacement, registered under `replaceShaderClip`, emitting the
   * clipping plane test in stabilized coordinates.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderClip(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Shader replacement, registered under `replaceShaderCoincidentOffset`,
   * emitting the depth offset the renderable's coincident topology resolution
   * asks for.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderCoincidentOffset(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Shader replacement, registered under `replaceShaderImage`, emitting the
   * texture declarations, the transfer function lookups and, for label maps,
   * the label outline code.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderImage(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Shader replacement, registered under `replaceShaderSelect`, emitting the
   * composite and attribute identifiers the hardware selector reads.
   *
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderSelect(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Render the slice during the translucent pass.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  translucentPass(prepass: boolean): void;

  /**
   * Build or reuse the texture holding the per-label outline opacities.
   */
  updateLabelOutlineOpacityTexture(): void;

  /**
   * Build or reuse the texture holding the per-label outline thicknesses.
   */
  updateLabelOutlineThicknessTexture(): void;

  /**
   * Build or reuse the texture holding the sampled color transfer functions.
   */
  updateLUTImage(): void;

  /**
   * Build or reuse the texture holding the sampled piecewise opacity
   * functions.
   */
  updateOpacityLUTImage(): void;

  /**
   * Recompute and send the mapper uniform buffer when the renderable, the
   * property or the clipping planes changed.
   */
  updateUBO(): void;

  /**
   * Render the slice depth only, so that a later pass can mix geometry with
   * volumes.
   *
   * @param {Boolean} prepass Whether the traversal is on its way down.
   */
  zBufferPass(prepass: boolean): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUImageMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUImageMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUImageMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUImageMapper.
 * @param {IWebGPUImageMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUImageMapperInitialValues
): vtkWebGPUImageMapper;

/**
 * vtkWebGPUImageMapper is the WebGPU scene graph node that draws a
 * vtkImageSlice whose mapper is a vtkImageMapper. It textures the slice onto a
 * full screen quad clipped to the slice geometry and assembles the WGSL that
 * applies the color transfer function, the piecewise opacity function and, for
 * label maps, the label outline.
 *
 * Importing this module registers it as the WebGPU override for
 * `vtkAbstractImageMapper`.
 */
declare const vtkWebGPUImageMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUImageMapper;
