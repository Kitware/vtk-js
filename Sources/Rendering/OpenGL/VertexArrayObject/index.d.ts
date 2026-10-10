import vtkOpenGLBufferObject from '../BufferObject';
import vtkOpenGLRenderWindow from '../RenderWindow';
import vtkShaderProgram from '../ShaderProgram';
import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * Initial values for creating a new instance of vtkOpenGLVertexArrayObject.
 */
export interface IOpenGLVertexArrayObjectInitialValues {
  handleVAO?: WebGLVertexArrayObject | number;
  handleProgram?: WebGLProgram | number;
  context?: Nullable<WebGL2RenderingContext>;
  _openGLRenderWindow?: Nullable<vtkOpenGLRenderWindow>;
}

export interface vtkOpenGLVertexArrayObject extends vtkObject {
  /**
   * Create the underlying GL vertex array object.
   */
  initialize(): void;

  /**
   * Whether the GL vertex array object exists.
   */
  isReady(): boolean;

  /**
   * Bind the vertex array object, creating it if needed.
   */
  bind(): void;

  /**
   * Unbind the vertex array object.
   */
  release(): void;

  /**
   * Drop the vertex array object so that it is rebuilt against the new program.
   */
  shaderProgramChanged(): void;

  /**
   * Delete the vertex array object.
   */
  releaseGraphicsResources(): void;

  /**
   * Bind a buffer to a program attribute.
   *
   * @param program The bound shader program.
   * @param buffer The array buffer holding the attribute.
   * @param name The attribute name in the program.
   * @param offset The offset in bytes of the attribute inside a block.
   * @param stride The size in bytes of a block.
   * @param elementType The GL type of a component.
   * @param elementTupleSize The number of components.
   * @param normalize Whether integer components are normalized.
   * @returns {boolean} False when the attribute could not be bound.
   */
  addAttributeArray(
    program: Nullable<vtkShaderProgram>,
    buffer: vtkOpenGLBufferObject,
    name: string,
    offset: number,
    stride: number,
    elementType: number,
    elementTupleSize: number,
    normalize: boolean
  ): boolean;

  /**
   * Bind a buffer to a program attribute, optionally instanced.
   *
   * @param program The bound shader program.
   * @param buffer The array buffer holding the attribute.
   * @param name The attribute name in the program.
   * @param offset The offset in bytes of the attribute inside a block.
   * @param stride The size in bytes of a block.
   * @param elementType The GL type of a component.
   * @param elementTupleSize The number of components.
   * @param normalize Whether integer components are normalized.
   * @param divisor When greater than zero, the attribute advances per instance.
   * @param isMatrix Whether the attribute is one row of a matrix attribute.
   * @returns {boolean} False when the attribute could not be bound.
   */
  addAttributeArrayWithDivisor(
    program: Nullable<vtkShaderProgram>,
    buffer: vtkOpenGLBufferObject,
    name: string,
    offset: number,
    stride: number,
    elementType: number,
    elementTupleSize: number,
    normalize: boolean,
    divisor: number,
    isMatrix: boolean
  ): boolean;

  /**
   * Bind a buffer to a matrix program attribute, one attribute slot per row.
   *
   * @param program The bound shader program.
   * @param buffer The array buffer holding the attribute.
   * @param name The attribute name in the program.
   * @param offset The offset in bytes of the attribute inside a block.
   * @param stride The size in bytes of a block.
   * @param elementType The GL type of a component.
   * @param elementTupleSize The number of rows and columns of the matrix.
   * @param normalize Whether integer components are normalized.
   * @param divisor When greater than zero, the attribute advances per instance.
   * @returns {boolean} False when the attribute could not be bound.
   */
  addAttributeMatrixWithDivisor(
    program: Nullable<vtkShaderProgram>,
    buffer: vtkOpenGLBufferObject,
    name: string,
    offset: number,
    stride: number,
    elementType: number,
    elementTupleSize: number,
    normalize: boolean,
    divisor: number
  ): boolean;

  /**
   * The attribute state lives inside the vertex array object and is overwritten
   * on the next bind, so this only reports whether the object is usable.
   *
   * @param name The attribute name in the program.
   */
  removeAttributeArray(name: string): boolean;

  /**
   * Attach this vertex array object to an OpenGL render window, releasing any
   * resources held for a previous one.
   *
   * @param renWin The OpenGL render window.
   */
  setOpenGLRenderWindow(renWin: Nullable<vtkOpenGLRenderWindow>): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLVertexArrayObject characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLVertexArrayObjectInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLVertexArrayObjectInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLVertexArrayObject.
 * @param {IOpenGLVertexArrayObjectInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLVertexArrayObjectInitialValues
): vtkOpenGLVertexArrayObject;

export declare const vtkOpenGLVertexArrayObject: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLVertexArrayObject;
