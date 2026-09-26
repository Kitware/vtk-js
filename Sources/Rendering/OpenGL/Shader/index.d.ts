import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * The kind of GLSL shader a vtkShader holds. 'Geometry' is accepted by the
 * model but WebGL has no geometry stage, so it never compiles.
 */
export type ShaderType = 'Vertex' | 'Fragment' | 'Geometry' | 'Unknown';

/**
 * Initial values for creating a new instance of vtkShader.
 */
export interface IShaderInitialValues {
  shaderType?: ShaderType;
  source?: string;
  error?: string;
  handle?: WebGLShader | number;
  dirty?: boolean;
  context?: Nullable<WebGL2RenderingContext>;
}

export interface vtkShader extends vtkObject {
  /**
   * Compile the shader source into the GL shader object.
   * @returns {boolean} True when the shader compiled.
   */
  compile(): boolean;

  /**
   * Delete the GL shader object, if any.
   */
  cleanup(): void;

  /**
   * Get the type of this shader.
   */
  getShaderType(): ShaderType;

  /**
   * Set the type of this shader.
   * @param shaderType The shader type.
   */
  setShaderType(shaderType: ShaderType): boolean;

  /**
   * Get the GLSL source of this shader.
   */
  getSource(): string;

  /**
   * Set the GLSL source of this shader.
   * @param source The GLSL source.
   */
  setSource(source: string): boolean;

  /**
   * Get the last error message.
   */
  getError(): string;

  /**
   * Set the error message.
   * @param error The error message.
   */
  setError(error: string): boolean;

  /**
   * Get the underlying GL shader object, or 0 when it has not been created.
   */
  getHandle(): WebGLShader | number;

  /**
   * Set the underlying GL shader object.
   * @param handle The GL shader object.
   */
  setHandle(handle: WebGLShader | number): boolean;

  /**
   * Get the WebGL context used to compile this shader.
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * Set the WebGL context used to compile this shader.
   * @param context The WebGL context.
   */
  setContext(context: Nullable<WebGL2RenderingContext>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkShader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IShaderInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IShaderInitialValues
): void;

/**
 * Method used to create a new instance of vtkShader.
 * @param {IShaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IShaderInitialValues): vtkShader;

export declare const vtkShader: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkShader;
