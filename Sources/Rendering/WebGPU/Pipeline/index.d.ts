/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkWebGPUBindGroup from '../BindGroup';
import vtkWebGPUDevice from '../Device';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPUShaderDescription, {
  WebGPUShaderType,
} from '../ShaderDescription';
import vtkWebGPUVertexInput from '../VertexInput';

/**
 * The parts of a GPU render pipeline description vtk.js fills in from the
 * render encoder and the mapper. The shader modules, the layout and the
 * topology are added by the pipeline itself when it is initialized.
 */
export interface IWebGPUPipelineSettings {
  label?: string;
  layout?: GPUPipelineLayout | GPUAutoLayoutMode;
  primitive?: Partial<GPUPrimitiveState>;
  depthStencil?: Partial<GPUDepthStencilState>;
  fragment?: Partial<GPUFragmentState>;
  vertex?: Partial<GPUVertexState>;
}

/**
 * A bind group layout of the pipeline, kept with the label of the bind group
 * it came from so that bind groups can find their index.
 */
export interface IWebGPUPipelineLayoutEntry {
  layout: GPUBindGroupLayout;
  label: string;
}

export interface IWebGPUPipelineInitialValues {
  extraPipelineSettings?: Nullable<IWebGPUPipelineSettings>;
  handle?: Nullable<GPURenderPipeline>;
  layouts?: IWebGPUPipelineLayoutEntry[];
  renderEncoder?: Nullable<vtkWebGPURenderEncoder>;
  shaderDescriptions?: vtkWebGPUShaderDescription[];
  vertexState?: Nullable<GPUVertexState>;
  topology?: Nullable<GPUPrimitiveTopology>;
  pipelineDescription?: Nullable<IWebGPUPipelineSettings>;
}

export interface vtkWebGPUPipeline extends vtkObject {
  /**
   * Get the shader descriptions of every stage of this pipeline.
   */
  getShaderDescriptions(): vtkWebGPUShaderDescription[];

  /**
   * Merge extra pipeline settings onto base settings, merging the primitive,
   * depthStencil and fragment states one level deep. Returns the base settings
   * unchanged when there are no extra settings.
   * @param {IWebGPUPipelineSettings} baseSettings
   * @param {IWebGPUPipelineSettings} extraSettings
   */
  applyPipelineSettings(
    baseSettings: IWebGPUPipelineSettings,
    extraSettings?: Nullable<IWebGPUPipelineSettings>
  ): IWebGPUPipelineSettings;

  /**
   * Create the GPU render pipeline from the render encoder settings, the bind
   * group layouts and the shader descriptions added so far.
   * @param {vtkWebGPUDevice} device
   * @param {String} hash the label given to the pipeline
   */
  initialize(device: vtkWebGPUDevice, hash: string): void;

  /**
   * Get the shader description of a stage, or null when this pipeline has
   * none for it.
   * @param {WebGPUShaderType} stype
   */
  getShaderDescription(
    stype: WebGPUShaderType
  ): Nullable<vtkWebGPUShaderDescription>;

  /**
   * Append the layout of a bind group to the pipeline layout. Does nothing
   * when the bind group is falsy.
   * @param {vtkWebGPUBindGroup} bindGroup
   */
  addBindGroupLayout(bindGroup: vtkWebGPUBindGroup): void;

  /**
   * Get the bind group layout at an index.
   * @param {Number} idx
   */
  getBindGroupLayout(idx: number): GPUBindGroupLayout;

  /**
   * Get the index of the bind group layout registered under a label, or -1
   * when there is none.
   * @param {String} llabel
   */
  getBindGroupLayoutIndex(llabel: string): number;

  /**
   * Bind the buffers of a vertex input onto a render encoder.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   * @param {vtkWebGPUVertexInput} vInput
   */
  bindVertexInput(
    renderEncoder: vtkWebGPURenderEncoder,
    vInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Get the underlying GPU render pipeline.
   */
  getHandle(): Nullable<GPURenderPipeline>;

  /**
   * Get the description the GPU render pipeline was created from.
   */
  getPipelineDescription(): Nullable<IWebGPUPipelineSettings>;

  /**
   * Get the device this pipeline is created on.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this pipeline is created on.
   * @param {vtkWebGPUDevice} device
   */
  setDevice(device: Nullable<vtkWebGPUDevice>): boolean;

  /**
   * Get the settings merged on top of the render encoder settings.
   */
  getExtraPipelineSettings(): Nullable<IWebGPUPipelineSettings>;

  /**
   * Set the settings merged on top of the render encoder settings.
   * @param {IWebGPUPipelineSettings} extraPipelineSettings
   */
  setExtraPipelineSettings(
    extraPipelineSettings: Nullable<IWebGPUPipelineSettings>
  ): boolean;

  /**
   * Get the render encoder providing the base pipeline settings.
   */
  getRenderEncoder(): Nullable<vtkWebGPURenderEncoder>;

  /**
   * Set the render encoder providing the base pipeline settings.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   */
  setRenderEncoder(renderEncoder: Nullable<vtkWebGPURenderEncoder>): boolean;

  /**
   * Get the primitive topology this pipeline draws.
   */
  getTopology(): Nullable<GPUPrimitiveTopology>;

  /**
   * Set the primitive topology this pipeline draws.
   * @param {GPUPrimitiveTopology} topology
   */
  setTopology(topology: Nullable<GPUPrimitiveTopology>): boolean;

  /**
   * Get the vertex state, i.e. the buffer layouts, of this pipeline.
   */
  getVertexState(): Nullable<GPUVertexState>;

  /**
   * Set the vertex state, i.e. the buffer layouts, of this pipeline.
   * @param {GPUVertexState} vertexState
   */
  setVertexState(vertexState: Nullable<GPUVertexState>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUPipeline characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUPipelineInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUPipelineInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUPipeline.
 * @param {IWebGPUPipelineInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUPipelineInitialValues
): vtkWebGPUPipeline;

/**
 * A GPU render pipeline, built from the settings of a render encoder, the bind
 * group layouts of its bindables and the shader modules of its stages.
 */
export declare const vtkWebGPUPipeline: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUPipeline;
