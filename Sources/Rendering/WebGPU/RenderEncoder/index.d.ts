/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkWebGPUBindGroup from '../BindGroup';
import vtkWebGPUPipeline, { IWebGPUPipelineSettings } from '../Pipeline';
import vtkWebGPUTextureView from '../TextureView';

/**
 * A callback registered by a mapper, invoked with the render encoder once its
 * pipeline is bound.
 */
export type WebGPUDrawCallback = (
  renderEncoder: vtkWebGPURenderEncoder
) => void;

export interface IWebGPURenderEncoderInitialValues {
  description?: GPURenderPassDescriptor;
  handle?: Nullable<GPURenderPassEncoder>;
  boundPipeline?: Nullable<vtkWebGPUPipeline>;
  pipelineHash?: Nullable<string>;
  pipelineSettings?: IWebGPUPipelineSettings;
  replaceShaderCodeFunction?: Nullable<(pipeline: vtkWebGPUPipeline) => void>;
  depthTextureView?: Nullable<vtkWebGPUTextureView>;
  label?: Nullable<string>;
}

export interface vtkWebGPURenderEncoder extends vtkObject {
  /**
   * Begin the render pass on a command encoder, clearing the draw callbacks
   * registered for the previous pass.
   * @param {GPUCommandEncoder} encoder
   */
  begin(encoder: GPUCommandEncoder): void;

  /**
   * Invoke the registered draw callbacks, pipeline by pipeline, then end the
   * render pass.
   */
  end(): void;

  /**
   * Bind a pipeline, unless it is already bound, and check that its
   * attachments match the ones of this encoder.
   * @param {vtkWebGPUPipeline} pl
   */
  setPipeline(pl: vtkWebGPUPipeline): void;

  /**
   * Apply this encoder's shader replacements to a pipeline.
   * @param {vtkWebGPUPipeline} pipeline
   */
  replaceShaderCode(pipeline: vtkWebGPUPipeline): void;

  /**
   * Set the texture view of a color attachment.
   * @param {Number} idx
   * @param {vtkWebGPUTextureView} view
   */
  setColorTextureView(idx: number, view: vtkWebGPUTextureView): void;

  /**
   * Bind a bind group at the index the bound pipeline registered its layout
   * under.
   * @param {vtkWebGPUBindGroup} bg
   */
  activateBindGroup(bg: vtkWebGPUBindGroup): void;

  /**
   * Point the color and depth attachments of the pass description at the
   * handles of the currently set texture views.
   */
  attachTextureViews(): void;

  /**
   * Register a draw callback to run for a pipeline when the pass ends.
   * @param {vtkWebGPUPipeline} pipeline
   * @param {WebGPUDrawCallback} cb
   */
  registerDrawCallback(
    pipeline: vtkWebGPUPipeline,
    cb: WebGPUDrawCallback
  ): void;

  /**
   * Forwarded to the underlying render pass encoder.
   */
  setBindGroup(
    index: GPUIndex32,
    bindGroup: Nullable<GPUBindGroup>,
    dynamicOffsets?: Iterable<GPUBufferDynamicOffset>
  ): void;

  /**
   * Forwarded to the underlying render pass encoder.
   */
  setIndexBuffer(
    buffer: GPUBuffer,
    indexFormat: GPUIndexFormat,
    offset?: GPUSize64,
    size?: GPUSize64
  ): void;

  /**
   * Forwarded to the underlying render pass encoder.
   */
  setVertexBuffer(
    slot: GPUIndex32,
    buffer: Nullable<GPUBuffer>,
    offset?: GPUSize64,
    size?: GPUSize64
  ): void;

  /**
   * Forwarded to the underlying render pass encoder.
   */
  draw(
    vertexCount: GPUSize32,
    instanceCount?: GPUSize32,
    firstVertex?: GPUSize32,
    firstInstance?: GPUSize32
  ): void;

  /**
   * Forwarded to the underlying render pass encoder.
   */
  drawIndexed(
    indexCount: GPUSize32,
    instanceCount?: GPUSize32,
    firstIndex?: GPUSize32,
    baseVertex?: GPUSignedOffset32,
    firstInstance?: GPUSize32
  ): void;

  /**
   * Get the pipeline currently bound on this encoder.
   */
  getBoundPipeline(): Nullable<vtkWebGPUPipeline>;

  /**
   * Get the texture views of the color attachments.
   */
  getColorTextureViews(): vtkWebGPUTextureView[];

  /**
   * Get the texture view of the depth attachment.
   */
  getDepthTextureView(): Nullable<vtkWebGPUTextureView>;

  /**
   * Set the texture view of the depth attachment.
   * @param {vtkWebGPUTextureView} depthTextureView
   */
  setDepthTextureView(
    depthTextureView: Nullable<vtkWebGPUTextureView>
  ): boolean;

  /**
   * Get the render pass description this encoder begins its pass with.
   */
  getDescription(): GPURenderPassDescriptor;

  /**
   * Set the render pass description this encoder begins its pass with.
   * @param {GPURenderPassDescriptor} description
   */
  setDescription(description: GPURenderPassDescriptor): boolean;

  /**
   * Get the underlying render pass encoder, valid between begin() and end().
   */
  getHandle(): Nullable<GPURenderPassEncoder>;

  /**
   * Set the underlying render pass encoder.
   * @param {GPURenderPassEncoder} handle
   */
  setHandle(handle: Nullable<GPURenderPassEncoder>): boolean;

  /**
   * Get the debug label pushed around the render pass.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the debug label pushed around the render pass.
   * @param {String} label
   */
  setLabel(label: Nullable<string>): boolean;

  /**
   * Get the string mappers add to their pipeline hash for this encoder.
   */
  getPipelineHash(): Nullable<string>;

  /**
   * Set the string mappers add to their pipeline hash for this encoder.
   * @param {String} pipelineHash
   */
  setPipelineHash(pipelineHash: Nullable<string>): boolean;

  /**
   * Get the pipeline settings every pipeline drawing into this encoder starts
   * from.
   */
  getPipelineSettings(): IWebGPUPipelineSettings;

  /**
   * Set the pipeline settings every pipeline drawing into this encoder starts
   * from.
   * @param {IWebGPUPipelineSettings} pipelineSettings
   */
  setPipelineSettings(pipelineSettings: IWebGPUPipelineSettings): boolean;

  /**
   * Get the function performing this encoder's shader replacements.
   */
  getReplaceShaderCodeFunction(): Nullable<
    (pipeline: vtkWebGPUPipeline) => void
  >;

  /**
   * Set the function performing this encoder's shader replacements. The
   * default one writes the computed color out to the first color attachment.
   * @param replaceShaderCodeFunction
   */
  setReplaceShaderCodeFunction(
    replaceShaderCodeFunction: Nullable<(pipeline: vtkWebGPUPipeline) => void>
  ): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPURenderEncoder characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPURenderEncoderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPURenderEncoderInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPURenderEncoder.
 * @param {IWebGPURenderEncoderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPURenderEncoderInitialValues
): vtkWebGPURenderEncoder;

/**
 * One render pass: the attachments it draws into, the pipeline settings its
 * pipelines are built from, and the draw callbacks the mappers register.
 */
export declare const vtkWebGPURenderEncoder: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPURenderEncoder;
