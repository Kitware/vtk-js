import vtkShader from '../Shader';
import { vtkObject } from '../../../interfaces';
import { Matrix, Matrix3x3, Nullable, TypedArray } from '../../../types';

/**
 * Result of a shader source substitution.
 */
export interface ISubstitutionResult {
  /**
   * Whether the substitution changed the source.
   */
  replace: boolean;

  /**
   * The resulting source.
   */
  result: string;
}

/**
 * Initial values for creating a new instance of vtkShaderProgram.
 */
export interface IShaderProgramInitialValues {
  fragmentShader?: vtkShader;
  geometryShader?: vtkShader;
  vertexShader?: vtkShader;
  vertexShaderHandle?: WebGLShader | number;
  fragmentShaderHandle?: WebGLShader | number;
  geometryShaderHandle?: WebGLShader | number;
  linked?: boolean;
  bound?: boolean;
  compiled?: boolean;
  error?: string;
  handle?: WebGLProgram | number;
  numberOfOutputs?: number;
  md5Hash?: string | number;
  context?: Nullable<WebGL2RenderingContext>;
  lastCameraMTime?: Nullable<number>;
}

export interface vtkShaderProgram extends vtkObject {
  /**
   * Compile the vertex and fragment shaders, attach them and link the program.
   * @returns {number} 1 on success, 0 on failure.
   */
  compileShader(): number;

  /**
   * Release the program and detach and delete its shaders.
   */
  cleanup(): void;

  /**
   * Make this program the current one, linking it first if needed.
   * @returns {boolean} True when the program is bound.
   */
  bind(): boolean;

  /**
   * Whether this program is the current one.
   */
  isBound(): boolean;

  /**
   * Unbind this program.
   */
  release(): void;

  /**
   * Set the WebGL context of the program and of its shaders.
   * @param context The WebGL context.
   */
  setContext(context: Nullable<WebGL2RenderingContext>): void;

  /**
   * Link the program.
   * @returns {boolean} True when the program is linked.
   */
  link(): boolean;

  /**
   * Set a mat4 uniform.
   * @param name The uniform name.
   * @param v The 16 matrix values.
   */
  setUniformMatrix(name: string, v: Matrix | TypedArray): boolean;

  /**
   * Set a mat3 uniform.
   * @param name The uniform name.
   * @param v The 9 matrix values.
   */
  setUniformMatrix3x3(name: string, v: Matrix3x3 | TypedArray): boolean;

  /**
   * Set a float uniform.
   * @param name The uniform name.
   * @param v The value.
   */
  setUniformf(name: string, v: number): boolean;

  /**
   * Set a float array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniformfv(name: string, v: number[] | Float32Array): boolean;

  /**
   * Set an int uniform.
   * @param name The uniform name.
   * @param v The value.
   */
  setUniformi(name: string, v: number): boolean;

  /**
   * Set an int array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniformiv(name: string, v: number[] | Int32Array): boolean;

  /**
   * Set a vec2 uniform.
   * @param name The uniform name.
   * @param v1 The first component.
   * @param v2 The second component.
   */
  setUniform2f(name: string, v1: number, v2: number): boolean;

  /**
   * Set a vec2 array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniform2fv(name: string, v: number[] | Float32Array): boolean;

  /**
   * Set an ivec2 uniform.
   * @param name The uniform name.
   * @param v1 The first component.
   * @param v2 The second component.
   */
  setUniform2i(name: string, v1: number, v2: number): boolean;

  /**
   * Set an ivec2 array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniform2iv(name: string, v: number[] | Int32Array): boolean;

  /**
   * Set a vec3 uniform.
   * @param name The uniform name.
   * @param a1 The first component.
   * @param a2 The second component.
   * @param a3 The third component.
   */
  setUniform3f(name: string, a1: number, a2: number, a3: number): boolean;

  /**
   * Set a vec3 uniform from an array of exactly three values.
   * @param name The uniform name.
   * @param a The three components.
   */
  setUniform3fArray(name: string, a: number[]): boolean;

  /**
   * Set a vec3 array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniform3fv(name: string, v: number[] | Float32Array): boolean;

  /**
   * Set an ivec3 uniform, either as three arguments or as a single array of
   * three values.
   * @param name The uniform name.
   * @param args The three components.
   */
  setUniform3i(
    name: string,
    ...args: [number, number, number] | [number[]]
  ): boolean;

  /**
   * Set an ivec3 array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniform3iv(name: string, v: number[] | Int32Array): boolean;

  /**
   * Set a vec4 uniform, either as four arguments or as a single array of four
   * values.
   * @param name The uniform name.
   * @param args The four components.
   */
  setUniform4f(
    name: string,
    ...args: [number, number, number, number] | [number[]]
  ): boolean;

  /**
   * Set a vec4 array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniform4fv(name: string, v: number[] | Float32Array): boolean;

  /**
   * Set an ivec4 uniform, either as four arguments or as a single array of four
   * values.
   * @param name The uniform name.
   * @param args The four components.
   */
  setUniform4i(
    name: string,
    ...args: [number, number, number, number] | [number[]]
  ): boolean;

  /**
   * Set an ivec4 array uniform.
   * @param name The uniform name.
   * @param v The values.
   */
  setUniform4iv(name: string, v: number[] | Int32Array): boolean;

  /**
   * Get the cached location of a uniform, or -1 when it is not used.
   * @param name The uniform name.
   */
  findUniform(name: string): WebGLUniformLocation | number;

  /**
   * Whether the given uniform exists in the linked program.
   * @param name The uniform name.
   */
  isUniformUsed(name: string): boolean;

  /**
   * Whether the given attribute exists in the linked program.
   * @param name The attribute name.
   */
  isAttributeUsed(name: string): boolean;

  /**
   * Attach a compiled shader to the program.
   * @param shader The shader to attach.
   */
  attachShader(shader: vtkShader): boolean;

  /**
   * Detach a shader from the program.
   * @param shader The shader to detach.
   */
  detachShader(shader: vtkShader): boolean;

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
   * Get the underlying GL program object, or 0 when it has not been created.
   */
  getHandle(): WebGLProgram | number;

  /**
   * Set the underlying GL program object.
   * @param handle The GL program object.
   */
  setHandle(handle: WebGLProgram | number): boolean;

  /**
   * Whether the program has been compiled.
   */
  getCompiled(): boolean;

  /**
   * Set the compiled flag.
   * @param compiled The compiled flag.
   */
  setCompiled(compiled: boolean): boolean;

  /**
   * Whether the program is currently bound.
   */
  getBound(): boolean;

  /**
   * Set the bound flag.
   * @param bound The bound flag.
   */
  setBound(bound: boolean): boolean;

  /**
   * Whether the program has been linked.
   */
  getLinked(): boolean;

  /**
   * Set the linked flag.
   * @param linked The linked flag.
   */
  setLinked(linked: boolean): boolean;

  /**
   * Get the hash of the shader sources this program was built from.
   */
  getMd5Hash(): string | number;

  /**
   * Set the hash of the shader sources this program was built from.
   * @param md5Hash The hash.
   */
  setMd5Hash(md5Hash: string | number): boolean;

  /**
   * Get the vertex shader.
   */
  getVertexShader(): vtkShader;

  /**
   * Set the vertex shader.
   * @param vertexShader The vertex shader.
   */
  setVertexShader(vertexShader: vtkShader): boolean;

  /**
   * Get the fragment shader.
   */
  getFragmentShader(): vtkShader;

  /**
   * Set the fragment shader.
   * @param fragmentShader The fragment shader.
   */
  setFragmentShader(fragmentShader: vtkShader): boolean;

  /**
   * Get the geometry shader. WebGL has no geometry stage; it is kept for
   * source substitution only.
   */
  getGeometryShader(): vtkShader;

  /**
   * Set the geometry shader.
   * @param geometryShader The geometry shader.
   */
  setGeometryShader(geometryShader: vtkShader): boolean;

  /**
   * Get the MTime of the camera the camera uniforms were last set from.
   */
  getLastCameraMTime(): Nullable<number>;

  /**
   * Set the MTime of the camera the camera uniforms were last set from.
   * @param mtime The camera MTime.
   */
  setLastCameraMTime(mtime: Nullable<number>): void;
}

/**
 * Perform string substitutions on shader source, used to build up shader
 * strings from templates.
 *
 * @param source The source to substitute into.
 * @param search The string or pattern to replace.
 * @param replace The replacement, joined with newlines when an array.
 * @param {Boolean} [all] (default: true) When false, only the first occurrence is replaced.
 */
export function substitute(
  source: string,
  search: string | RegExp,
  replace: string | string[],
  all?: boolean
): ISubstitutionResult;

/**
 * Method used to decorate a given object (publicAPI+model) with vtkShaderProgram characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IShaderProgramInitialValues} [initialValues] (default: {})
 */
declare function extend(
  publicAPI: object,
  model: object,
  initialValues?: IShaderProgramInitialValues
): void;

/**
 * Method used to create a new instance of vtkShaderProgram.
 * @param {IShaderProgramInitialValues} [initialValues] for pre-setting some of its content
 */
declare function newInstance(
  initialValues?: IShaderProgramInitialValues
): vtkShaderProgram;

export declare const vtkShaderProgram: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  substitute: typeof substitute;
};
export default vtkShaderProgram;
