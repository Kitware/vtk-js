import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkWebGPUVertexInput from '../VertexInput';

/**
 * The shader stage a description belongs to.
 */
export type WebGPUShaderType = 'vertex' | 'fragment';

export interface IWebGPUShaderDescriptionInitialValues {
  type?: WebGPUShaderType;
  hash?: string;
  code?: string;
  outputNames?: string[];
  outputTypes?: string[];
}

export interface vtkWebGPUShaderDescription extends vtkObject {
  /**
   * Check whether an output of that name was already added.
   * @param {String} name
   */
  hasOutput(name: string): boolean;

  /**
   * Add a location output to the shader's output struct.
   * @param {String} type the WGSL type, e.g. `vec4<f32>`
   * @param {String} name
   * @param {String} [interpolation] the WGSL interpolation qualifier
   */
  addOutput(type: string, name: string, interpolation?: string): void;

  /**
   * Add a builtin output, e.g. `@builtin(position) Position`, to the shader's
   * output struct.
   * @param {String} type the WGSL type, e.g. `vec4<f32>`
   * @param {String} name
   */
  addBuiltinOutput(type: string, name: string): void;

  /**
   * Add a builtin input, e.g. `@builtin(vertex_index) vertexIndex`, to the
   * shader's input struct.
   * @param {String} type the WGSL type, e.g. `u32`
   * @param {String} name
   */
  addBuiltinInput(type: string, name: string): void;

  /**
   * Substitute the IOStructs tokens of the code with the input and output
   * structs of this stage. The inputs are taken from the outputs of the prior
   * stage and, when provided, from the vertex input.
   * @param {vtkWebGPUShaderDescription} priorStage the preceding shader stage
   * @param {vtkWebGPUVertexInput} [vertexInput]
   */
  replaceShaderCode(
    priorStage: Nullable<vtkWebGPUShaderDescription>,
    vertexInput?: vtkWebGPUVertexInput
  ): void;

  /**
   * Get the shader stage this description is for.
   */
  getType(): WebGPUShaderType;

  /**
   * Set the shader stage this description is for.
   * @param {WebGPUShaderType} type
   */
  setType(type: WebGPUShaderType): boolean;

  /**
   * Get the hash identifying the shader source.
   */
  getHash(): string;

  /**
   * Set the hash identifying the shader source.
   * @param {String} hash
   */
  setHash(hash: string): boolean;

  /**
   * Get the WGSL source of the shader.
   */
  getCode(): string;

  /**
   * Set the WGSL source of the shader.
   * @param {String} code
   */
  setCode(code: string): boolean;

  /**
   * Get a copy of the WGSL types of the location outputs.
   */
  getOutputTypes(): string[];

  /**
   * Get the WGSL types of the location outputs without copying them.
   */
  getOutputTypesByReference(): string[];

  /**
   * Get a copy of the names of the location outputs.
   */
  getOutputNames(): string[];

  /**
   * Get the names of the location outputs without copying them.
   */
  getOutputNamesByReference(): string[];

  /**
   * Get a copy of the interpolation qualifiers of the location outputs. An
   * entry is undefined when the output was added without one.
   */
  getOutputInterpolations(): Array<string | undefined>;

  /**
   * Get the interpolation qualifiers of the location outputs without copying
   * them.
   */
  getOutputInterpolationsByReference(): Array<string | undefined>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUShaderDescription characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUShaderDescriptionInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUShaderDescriptionInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUShaderDescription.
 * @param {IWebGPUShaderDescriptionInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUShaderDescriptionInitialValues
): vtkWebGPUShaderDescription;

/**
 * The WGSL source of one shader stage, along with the inputs and outputs that
 * are substituted into it.
 */
export declare const vtkWebGPUShaderDescription: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUShaderDescription;
