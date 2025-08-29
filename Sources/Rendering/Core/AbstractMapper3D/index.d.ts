import { Bounds, Vector3 } from '../../../types';
import vtkAbstractMapper, {
  IAbstractMapperInitialValues,
} from '../AbstractMapper';

/**
 *
 */
export interface IAbstractMapper3DInitialValues
  extends IAbstractMapperInitialValues {
  bounds?: Bounds;
  center?: Vector3;
}

export interface vtkAbstractMapper3D extends vtkAbstractMapper {
  /**
   * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
   * Bounds are (re)computed if needed.
   * @return {Bounds} A copy of the bounds for the mapper.
   * @see getBoundsByReference
   * @see computeBounds
   */
  getBounds(): Bounds;

  /**
   * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
   * Bounds are (re)computed if needed.
   * @return {Bounds} The bounds array of the mapper.
   * @see getBounds
   * @see computeBounds
   */
  getBoundsByReference(): Bounds;

  /**
   * Compute the bounds for this mapper.
   * Must be implemented by sub-classes. Called by getBounds methods.
   * @see getBoundsByReference
   * @see getBounds
   */
  computeBounds(): void;

  /**
   * Get the center of this mapper’s data.
   * @return {Vector3} The center of the mapper's data.
   */
  getCenter(): Vector3;

  /**
   * Get the diagonal length of this mappers bounding box.
   * @return {Number} The diagonal length of mapper bounding box.
   */
  getLength(): number;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkAbstractMapper3D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractMapper3DInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAbstractMapper3DInitialValues
): void;

/**
 * vtkAbstractMapper3D is an abstract class to specify interface between 3D
 * data and graphics primitives or software rendering techniques. Subclasses
 * of vtkAbstractMapper3D can be used for rendering geometry or rendering
 * volumetric data.
 *
 * This class also defines an API to support hardware clipping planes (at most
 * six planes can be defined). It also provides geometric data about the input
 * data it maps, such as the bounding box and center.
 */
export declare const vtkAbstractMapper3D: {
  extend: typeof extend;
};
export default vtkAbstractMapper3D;
