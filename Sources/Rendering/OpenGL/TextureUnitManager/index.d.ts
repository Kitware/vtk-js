import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * Initial values for creating a new instance of vtkOpenGLTextureUnitManager.
 */
export interface IOpenGLTextureUnitManagerInitialValues {
  context?: Nullable<WebGL2RenderingContext>;
  numberOfTextureUnits?: number;
}

export interface vtkOpenGLTextureUnitManager extends vtkObject {
  /**
   * Drop the allocation table, reporting any unit that was not released.
   */
  deleteTable(): void;

  /**
   * Set the WebGL context and size the allocation table from
   * `MAX_TEXTURE_IMAGE_UNITS`.
   *
   * @param context The WebGL context.
   */
  setContext(context: Nullable<WebGL2RenderingContext>): void;

  /**
   * Get the WebGL context.
   */
  getContext(): Nullable<WebGL2RenderingContext>;

  /**
   * Reserve the first free texture unit.
   * @returns {number} The unit number, or -1 when none is free.
   */
  allocate(): number;

  /**
   * Reserve a specific texture unit.
   * @param unit The unit to reserve.
   * @returns {number} The unit number, or -1 when it was already allocated.
   */
  allocateUnit(unit: number): number;

  /**
   * Whether the given texture unit is allocated.
   * @param textureUnitId The unit to test.
   */
  isAllocated(textureUnitId: number): boolean;

  /**
   * Release a texture unit.
   * @param val The unit to release.
   */
  free(val: number): void;

  /**
   * Release every texture unit.
   */
  freeAll(): void;

  /**
   * Get the number of texture units the context exposes.
   */
  getNumberOfTextureUnits(): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOpenGLTextureUnitManager characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOpenGLTextureUnitManagerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOpenGLTextureUnitManagerInitialValues
): void;

/**
 * Method used to create a new instance of vtkOpenGLTextureUnitManager.
 * @param {IOpenGLTextureUnitManagerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IOpenGLTextureUnitManagerInitialValues
): vtkOpenGLTextureUnitManager;

export declare const vtkOpenGLTextureUnitManager: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOpenGLTextureUnitManager;
