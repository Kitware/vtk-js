/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import { IViewNodeInitialValues, vtkViewNode } from '../../SceneGraph/ViewNode';
import { IWebGPUBindable } from '../BindGroup';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUPipeline, { IWebGPUPipelineSettings } from '../Pipeline';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPURenderer from '../Renderer';
import vtkWebGPUStorageBuffer from '../StorageBuffer';
import vtkWebGPUTextureView from '../TextureView';
import vtkWebGPUUniformBuffer from '../UniformBuffer';
import vtkWebGPUVertexInput from '../VertexInput';

/**
 * A shader replacement function, registered on the mapper's replacement map
 * under the name of the `//VTK::Section::` tag it fills in.
 */
export type WebGPUShaderReplacement = (
  hash: string,
  pipeline: vtkWebGPUPipeline,
  vertexInput: vtkWebGPUVertexInput
) => void;

export interface IWebGPUSimpleMapperInitialValues extends IViewNodeInitialValues {
  additionalBindables?: IWebGPUBindable[];
  device?: Nullable<vtkWebGPUDevice>;
  fragmentShaderTemplate?: Nullable<string>;
  interpolate?: boolean;
  numberOfInstances?: number;
  numberOfVertices?: number;
  pipelineHash?: Nullable<string>;
  shaderReplacements?: Nullable<Map<string, WebGPUShaderReplacement>>;
  SSBO?: Nullable<vtkWebGPUStorageBuffer>;
  textureViews?: vtkWebGPUTextureView[];
  topology?: GPUPrimitiveTopology;
  UBO?: Nullable<vtkWebGPUUniformBuffer>;
  vertexShaderTemplate?: Nullable<string>;
  WebGPURenderer?: Nullable<vtkWebGPURenderer>;
}

export interface vtkWebGPUSimpleMapper extends vtkViewNode {
  /**
   * Create the vertex and fragment shader descriptions of a pipeline from the
   * shader templates, then invoke every registered shader replacement whose
   * `//VTK::Section::` tag appears in them. The IOStructs replacement is always
   * invoked last, as the other replacements can add shader inputs and outputs.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  generateShaderDescriptions(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Build the input and output structs of both shader stages.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderIOStructs(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Let the render encoder emit its own fragment output declarations.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderRenderEncoder(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Emit the declarations of the renderer bind group. Does nothing when the
   * mapper has no WebGPU renderer.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderRenderer(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Emit the declarations of the mapper bind group.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderMapper(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Emit the clip space position of the vertex.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderPosition(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Declare the texture coordinate passed from the vertex to the fragment
   * stage.
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderTCoord(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * Add a texture view to the ones bound by this mapper, unless it is already
   * there.
   * @param {vtkWebGPUTextureView} view
   */
  addTextureView(view: vtkWebGPUTextureView): void;

  /**
   * Do everything needed for this mapper to be ready to draw: update the
   * input, the buffers, the bindings and the pipeline. Does not bind anything
   * nor record any draw command, as the pipeline may not be bound yet.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   */
  prepareToDraw(renderEncoder: vtkWebGPURenderEncoder): void;

  /**
   * Bring the input data of this mapper up to date.
   */
  updateInput(): void;

  /**
   * Create and update the buffers this mapper draws from.
   */
  updateBuffers(): void;

  /**
   * Set the bindables of the mapper bind group. Done on every draw, as
   * bindings can change without the pipeline hash changing.
   */
  updateBindings(): void;

  /**
   * Compute the hash the pipeline of this mapper is cached under.
   */
  computePipelineHash(): void;

  /**
   * Get the pipeline settings merged on top of the render encoder settings.
   */
  getPipelineSettings(): Nullable<IWebGPUPipelineSettings>;

  /**
   * Register this mapper's draw call on an encoder, to be invoked once the
   * pipeline is bound.
   * @param {vtkWebGPURenderEncoder} encoder
   */
  registerDrawCallback(encoder: vtkWebGPURenderEncoder): void;

  /**
   * Prepare, bind the pipeline and draw immediately.
   * @param {vtkWebGPURenderEncoder} encoder
   */
  prepareAndDraw(encoder: vtkWebGPURenderEncoder): void;

  /**
   * Record the draw commands of this mapper. The command encoder and the
   * pipeline must already be bound.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   */
  draw(renderEncoder: vtkWebGPURenderEncoder): void;

  /**
   * Get the objects bound by the mapper bind group: the additional bindables,
   * the uniform and storage buffers, and the texture views with their
   * samplers.
   */
  getBindables(): IWebGPUBindable[];

  /**
   * Fetch the pipeline of the current hash from the device, building it when
   * the device has none.
   */
  updatePipeline(): void;

  /**
   * Release the GPU resources of the vertex input, the bind group and the
   * buffers, and drop the pipeline, the render encoder and the texture views.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the render pipeline this mapper draws with.
   */
  getPipeline(): Nullable<vtkWebGPUPipeline>;

  /**
   * Get the vertex input of this mapper.
   */
  getVertexInput(): vtkWebGPUVertexInput;

  /**
   * Get the bindables added to the mapper bind group ahead of the buffers and
   * texture views.
   */
  getAdditionalBindables(): IWebGPUBindable[];

  /**
   * Set the bindables added to the mapper bind group ahead of the buffers and
   * texture views.
   * @param {IWebGPUBindable[]} additionalBindables
   */
  setAdditionalBindables(additionalBindables: IWebGPUBindable[]): boolean;

  /**
   * Get the device this mapper creates its resources on.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this mapper creates its resources on.
   * @param {vtkWebGPUDevice} device
   */
  setDevice(device: Nullable<vtkWebGPUDevice>): boolean;

  /**
   * Get the WGSL template the fragment shader is assembled from.
   */
  getFragmentShaderTemplate(): Nullable<string>;

  /**
   * Set the WGSL template the fragment shader is assembled from.
   * @param {String} fragmentShaderTemplate
   */
  setFragmentShaderTemplate(fragmentShaderTemplate: Nullable<string>): boolean;

  /**
   * Get whether the textures of this mapper are sampled with interpolation.
   */
  getInterpolate(): boolean;

  /**
   * Set whether the textures of this mapper are sampled with interpolation.
   * @param {Boolean} interpolate
   */
  setInterpolate(interpolate: boolean): boolean;

  /**
   * Get the number of instances drawn.
   */
  getNumberOfInstances(): number;

  /**
   * Set the number of instances drawn.
   * @param {Number} numberOfInstances
   */
  setNumberOfInstances(numberOfInstances: number): boolean;

  /**
   * Get the number of vertices drawn when there is no index buffer.
   */
  getNumberOfVertices(): number;

  /**
   * Set the number of vertices drawn when there is no index buffer.
   * @param {Number} numberOfVertices
   */
  setNumberOfVertices(numberOfVertices: number): boolean;

  /**
   * Get the hash the pipeline of this mapper is cached under.
   */
  getPipelineHash(): Nullable<string>;

  /**
   * Set the hash the pipeline of this mapper is cached under.
   * @param {String} pipelineHash
   */
  setPipelineHash(pipelineHash: Nullable<string>): boolean;

  /**
   * Get the shader replacement functions, keyed by the name of the
   * `//VTK::Section::` tag they fill in.
   */
  getShaderReplacements(): Map<string, WebGPUShaderReplacement>;

  /**
   * Set the shader replacement functions.
   * @param shaderReplacements
   */
  setShaderReplacements(
    shaderReplacements: Map<string, WebGPUShaderReplacement>
  ): boolean;

  /**
   * Get the storage buffer bound by this mapper.
   */
  getSSBO(): Nullable<vtkWebGPUStorageBuffer>;

  /**
   * Set the storage buffer bound by this mapper.
   * @param {vtkWebGPUStorageBuffer} SSBO
   */
  setSSBO(SSBO: Nullable<vtkWebGPUStorageBuffer>): boolean;

  /**
   * Get the texture views bound by this mapper.
   */
  getTextureViews(): vtkWebGPUTextureView[];

  /**
   * Set the texture views bound by this mapper.
   * @param {vtkWebGPUTextureView[]} textureViews
   */
  setTextureViews(textureViews: vtkWebGPUTextureView[]): boolean;

  /**
   * Get the primitive topology this mapper draws.
   */
  getTopology(): GPUPrimitiveTopology;

  /**
   * Set the primitive topology this mapper draws.
   * @param {GPUPrimitiveTopology} topology
   */
  setTopology(topology: GPUPrimitiveTopology): boolean;

  /**
   * Get the uniform buffer bound by this mapper.
   */
  getUBO(): Nullable<vtkWebGPUUniformBuffer>;

  /**
   * Set the uniform buffer bound by this mapper.
   * @param {vtkWebGPUUniformBuffer} UBO
   */
  setUBO(UBO: Nullable<vtkWebGPUUniformBuffer>): boolean;

  /**
   * Get the WGSL template the vertex shader is assembled from.
   */
  getVertexShaderTemplate(): Nullable<string>;

  /**
   * Set the WGSL template the vertex shader is assembled from.
   * @param {String} vertexShaderTemplate
   */
  setVertexShaderTemplate(vertexShaderTemplate: Nullable<string>): boolean;

  /**
   * Get the scene graph renderer this mapper draws inside.
   */
  getWebGPURenderer(): Nullable<vtkWebGPURenderer>;

  /**
   * Set the scene graph renderer this mapper draws inside.
   * @param {vtkWebGPURenderer} WebGPURenderer
   */
  setWebGPURenderer(WebGPURenderer: Nullable<vtkWebGPURenderer>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUSimpleMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUSimpleMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUSimpleMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUSimpleMapper.
 * @param {IWebGPUSimpleMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUSimpleMapperInitialValues
): vtkWebGPUSimpleMapper;

/**
 * The base of the WebGPU mappers: owns a vertex input, a bind group, a
 * pipeline and the shader templates and replacement functions the shader code
 * is assembled from.
 */
export declare const vtkWebGPUSimpleMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUSimpleMapper;
