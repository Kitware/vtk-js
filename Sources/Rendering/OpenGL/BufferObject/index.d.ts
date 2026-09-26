import { ObjectType } from './Constants';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkOpenGLRenderWindow from '../RenderWindow';

/**
 * Interface for initial values of BufferObject
 */
export interface IBufferObjectInitialValues {
  objectType?: ObjectType;
  context?: WebGL2RenderingContext;
  allocatedGPUMemoryInBytes?: number;
}

/**
 * Interface for OpenGL Buffer Object
 */
export interface vtkOpenGLBufferObject extends vtkObject {
  /**
   * Gets the type of the buffer object.
   * @returns {Nullable<ObjectType>} The type of the buffer object.
   */
  getType(): Nullable<ObjectType>;

  /**
   * Sets the type of the buffer object.
   * @param value The type to set.
   */
  setType(value: ObjectType): void;

  /**
   * Gets the WebGL handle of the buffer object.
   * @returns The WebGL buffer handle.
   */
  getHandle(): Nullable<WebGLBuffer>;

  /**
   * Checks if the buffer object is ready, i.e. data has been uploaded.
   * @returns {boolean} Whether the buffer object is ready.
   */
  isReady(): boolean;

  /**
   * Generates the underlying WebGL buffer if needed.
   * @param type The type of the buffer object.
   * @returns {boolean} Whether the generated buffer is compatible with the given type.
   */
  generateBuffer(type: ObjectType): boolean;

  /**
   * Uploads data to the buffer object.
   * @param data The data to be uploaded.
   * @param type The type of the data.
   * @returns {boolean} Whether the upload was successful.
   */
  upload(data: any, type: any): boolean;

  /**
   * Binds the buffer object.
   * @returns {boolean} Whether the binding was successful.
   */
  bind(): boolean;

  /**
   * Releases the buffer object.
   * @returns {boolean} Whether the release was successful.
   */
  release(): boolean;

  /**
   * Releases graphics resources associated with the buffer object.
   */
  releaseGraphicsResources(): void;

  /**
   * Sets the OpenGL render window.
   * @param renWin The render window to set.
   */
  setOpenGLRenderWindow(renWin: vtkOpenGLRenderWindow): void;

  /**
   * Gets the OpenGL render window.
   * @returns The render window.
   */
  getOpenGLRenderWindow(): Nullable<vtkOpenGLRenderWindow>;

  /**
   * Gets the amount of GPU memory allocated by the buffer object in bytes.
   * @returns {number} The allocated GPU memory in bytes.
   */
  getAllocatedGPUMemoryInBytes(): number;

  /**
   * Retrieves the error message, if any.
   * @returns {string} The error message.
   */
  getError(): string;
}

/**
 * Extends the given object with the properties and methods of vtkOpenGLBufferObject.
 * @param publicAPI The public API to extend.
 * @param model The model to extend.
 * @param initialValues The initial values to apply.
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IBufferObjectInitialValues
): void;

/**
 * Creates a new instance of vtkOpenGLBufferObject with the given initial values.
 * @param initialValues The initial values to use.
 * @returns {vtkOpenGLBufferObject} The new instance.
 */
export function newInstance(
  initialValues?: IBufferObjectInitialValues
): vtkOpenGLBufferObject;

/**
 * Object containing the newInstance and extend functions for vtkOpenGLBufferObject.
 */
export declare const vtkOpenGLBufferObject: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  ObjectType: typeof ObjectType;
};
export declare const STATIC: Readonly<Record<never, never>>;
export default vtkOpenGLBufferObject;
