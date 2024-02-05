import { ObjectType } from './Constants';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 * Interface for initial values of BufferObject
 */
export interface IBufferObjectInitialValues {
  objectType?: ObjectType;
  context?: WebGLRenderingContext | WebGL2RenderingContext;
  allocatedGPUMemoryInBytes?: number;
}

/**
 * Interface for OpenGL Buffer Object
 */
export interface vtkOpenGLBufferObject extends vtkObject {
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
  setOpenGLRenderWindow(renWin: any): void;

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
export function newInstance(initialValues?: IBufferObjectInitialValues): vtkOpenGLBufferObject;

/**
 * Object containing the newInstance and extend functions for vtkOpenGLBufferObject.
 */
export declare const vtkOpenGLBufferObject: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLBufferObject;
