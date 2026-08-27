/// <reference types="@webgpu/types" />

import vtkCellArray from '../../../Common/Core/CellArray';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { ICoincidentTopology } from '../../Core/Mapper/CoincidentTopologyHelper';
import { Representation } from '../../Core/Property/Constants';
import { BufferUsage, PrimitiveTypes } from '../BufferManager/Constants';
import vtkWebGPUPipeline, { IWebGPUPipelineSettings } from '../Pipeline';
import vtkWebGPURenderEncoder from '../RenderEncoder';
import vtkWebGPUSimpleMapper, {
  IWebGPUSimpleMapperInitialValues,
} from '../SimpleMapper';
import vtkWebGPUVertexInput from '../VertexInput';

export interface IWebGPUCellArrayMapperInitialValues extends IWebGPUSimpleMapperInitialValues {
  depthOnlyPass?: boolean;
  selectionPass?: boolean;
  is2D?: boolean;
  cellArray?: vtkCellArray;
  currentInput?: vtkPolyData;
  cellOffset?: number;
  primitiveType?: PrimitiveTypes;
  colorTexture?: unknown;
  renderEncoder?: vtkWebGPURenderEncoder;
  textures?: unknown[];
}

export interface vtkWebGPUCellArrayMapper extends vtkWebGPUSimpleMapper {
  /**
   * Locate the actor, renderer, render window and device this mapper draws
   * through, and pick the coordinate system from the actor.
   * @param prepass
   */
  buildPass(prepass: boolean): void;

  /**
   * Whether this mapper draws the edges of triangles or triangle strips.
   */
  isEdgePrimitive(): boolean;

  /**
   * Whether this pass should be skipped, which is the case for edges during
   * the depth only and the selection passes.
   */
  shouldSkipPass(): boolean;

  /**
   * Prepare and register the draw callback of this mapper on an encoder.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   * @param {Boolean} [depthOnly] (default: false)
   */
  renderForPass(
    renderEncoder: vtkWebGPURenderEncoder,
    depthOnly?: boolean
  ): void;

  /**
   * @param prepass
   */
  translucentPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  opaquePass(prepass: boolean): void;

  /**
   * @param prepass
   */
  zBufferPass(prepass: boolean): void;

  /**
   * @param prepass
   */
  opaqueZBufferPass(prepass: boolean): void;

  /**
   * Fill the mapper uniform buffer from the actor matrices, its property and
   * the clipping planes of the renderable, then send it if anything changed.
   */
  updateUBO(): void;

  /**
   * Whether the primitive is drawn as wide lines, which are emulated with one
   * instance per pixel of line width.
   */
  haveWideLines(): boolean;

  /**
   * Get the cull mode from the front and back face culling flags of the
   * actor's property.
   */
  getCullMode(): GPUCullMode;

  /**
   * Get the pipeline settings: the cull mode, plus a color target with writes
   * masked off during the depth only pass.
   */
  getPipelineSettings(): IWebGPUPipelineSettings;

  /**
   * Get the polygon offset factor and offset applied to this primitive, from
   * the coincident topology resolution of the renderable. Point picking always
   * adds an offset.
   */
  getCoincidentParameters(): ICoincidentTopology;

  /**
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
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderNormal(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderLight(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
   * @param {String} hash the pipeline hash
   * @param {vtkWebGPUPipeline} pipeline
   * @param {vtkWebGPUVertexInput} vertexInput
   */
  replaceShaderColor(
    hash: string,
    pipeline: vtkWebGPUPipeline,
    vertexInput: vtkWebGPUVertexInput
  ): void;

  /**
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
   * Get the buffer usage the primitive is drawn with for a representation.
   * @param {Representation} rep the representation of the actor's property
   * @param {PrimitiveTypes} i the primitive type
   */
  getUsage(rep: Representation, i: PrimitiveTypes): BufferUsage;

  /**
   * Get the part of the pipeline hash that depends on the buffer usage.
   * @param {BufferUsage} usage
   */
  getHashFromUsage(usage: BufferUsage): string;

  /**
   * Get the primitive topology a buffer usage is drawn with.
   * @param {BufferUsage} usage
   */
  getTopologyFromUsage(usage: BufferUsage): GPUPrimitiveTopology;

  /**
   * Build the vertex input of this mapper: the point, normal, color and
   * texture coordinate buffers of the cell array, plus the index buffer when
   * the primitive needs one.
   */
  buildVertexInput(): void;

  /**
   * Create the texture views and samplers of the textures of the renderable,
   * dropping the ones that are no longer used.
   */
  updateTextures(): void;

  /**
   * Get the cell array this mapper draws.
   */
  getCellArray(): vtkCellArray;

  /**
   * Set the cell array this mapper draws.
   * @param {vtkCellArray} cellArray
   */
  setCellArray(cellArray: vtkCellArray): boolean;

  /**
   * Get the polydata the cell array belongs to.
   */
  getCurrentInput(): vtkPolyData;

  /**
   * Set the polydata the cell array belongs to.
   * @param {vtkPolyData} currentInput
   */
  setCurrentInput(currentInput: vtkPolyData): boolean;

  /**
   * Get the index of the first cell of this cell array within the polydata,
   * used to look up cell data.
   */
  getCellOffset(): number;

  /**
   * Set the index of the first cell of this cell array within the polydata.
   * @param {Number} cellOffset
   */
  setCellOffset(cellOffset: number): boolean;

  /**
   * Get whether this mapper draws in 2D, i.e. under a vtkWebGPUActor2D.
   */
  getIs2D(): boolean;

  /**
   * Set whether this mapper draws in 2D, i.e. under a vtkWebGPUActor2D.
   * @param {Boolean} is2D
   */
  setIs2D(is2D: boolean): boolean;

  /**
   * Get the primitive type of the cell array.
   */
  getPrimitiveType(): PrimitiveTypes;

  /**
   * Set the primitive type of the cell array.
   * @param {PrimitiveTypes} primitiveType
   */
  setPrimitiveType(primitiveType: PrimitiveTypes): boolean;

  /**
   * Get the render encoder this mapper last drew through.
   */
  getRenderEncoder(): vtkWebGPURenderEncoder;

  /**
   * Set the render encoder this mapper draws through.
   * @param {vtkWebGPURenderEncoder} renderEncoder
   */
  setRenderEncoder(renderEncoder: vtkWebGPURenderEncoder): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUCellArrayMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUCellArrayMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUCellArrayMapperInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUCellArrayMapper.
 * @param {IWebGPUCellArrayMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUCellArrayMapperInitialValues
): vtkWebGPUCellArrayMapper;

/**
 * Draws one cell array of a polydata. The WebGPU polydata mappers create one
 * of these per non empty cell array, and this class assembles the shader code,
 * the vertex input and the uniform buffer of that primitive.
 */
export declare const vtkWebGPUCellArrayMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUCellArrayMapper;
