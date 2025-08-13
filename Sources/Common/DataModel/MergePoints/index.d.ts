import { Vector3 } from '../../../types';
import vtkPointLocator, {
  IInsertPointResult,
  IPointLocatorInitialValues,
} from '../PointLocator';

/**
 * Initial values for vtkMergePoints.
 */
export interface IMergePointsInitialValues extends IPointLocatorInitialValues {
  bucketSize?: number;
}

export interface vtkMergePoints extends vtkPointLocator {
  /**
   * Check if a point is already inserted in the merge points structure.
   *
   * @param {Vector3} x The point to check.
   * @returns {Number} The ID of the point if it exists, otherwise -1.
   */
  isInsertedPoint(x: Vector3): number;

  /**
   * Insert a point into the merge points structure.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Vector3} x The point to insert as an array of 3 numbers.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  insertUniquePoint(x: Vector3): IInsertPointResult;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkMergePoints characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IMergePointsInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IMergePointsInitialValues
): void;

/**
 * Method used to create a new instance of vtkMergePoints.
 * @param {IMergePointsInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IMergePointsInitialValues
): vtkMergePoints;

/**
 * vtkMergePoints merge exactly coincident points.
 *
 * vtkMergePoints is a locator object to quickly locate points in 3D.
 */
export declare const vtkMergePoints: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkMergePoints;
