import { Bounds, Nullable, Vector3 } from '../../../types';
import vtkPoints from '../../Core/Points';
import vtkAbstractPointLocator, {
  IAbstractPointLocatorInitialValues,
} from '../AbstractPointLocator';
import vtkPolyData from '../PolyData';

/**
 *
 */
export interface IPointLocatorInitialValues
  extends IAbstractPointLocatorInitialValues {
  numberOfPointsPerBucket?: number;
  bucketSize?: number;
}

export interface IInsertPointResult {
  inserted: boolean;
  id: number;
}

interface IFindClosestPointResult {
  id: number;
  dist2: number;
}

export interface vtkPointLocator extends vtkAbstractPointLocator {
  /**
   * Find the closest inserted point to the given coordinates.
   *
   * @param {Vector3} x The query point
   * @returns {Number} The id of the closest inserted point or -1 if not found
   */
  findClosestInsertedPoint(x: Vector3): number;

  /**
   * Find the closest point to a given point.
   *
   * @param {Vector3} x The point coordinates
   * @returns The id of the closest point or -1 if not found
   */
  findClosestPoint(x: Vector3): number;

  /**
   * Find the closest point within a specified radius.
   *
   * @param {Number} radius The search radius
   * @param {Vector3} x The point coordinates
   * @param {Number} inputDataLength The length of the input data
   * @returns {IFindClosestPointResult} The closest point result
   */
  findClosestPointWithinRadius(
    radius: number,
    x: Vector3,
    inputDataLength?: number
  ): IFindClosestPointResult;

  /**
   * Free the search structure and reset the locator.
   */
  freeSearchStructure(): void;

  /**
   * Generate a polydata representation of the point locator.
   *
   * @param {vtkPolyData} polydata The polydata to generate representation for
   * @returns
   */
  generateRepresentation(polydata: vtkPolyData): boolean;

  /**
   * Get the number of points per bucket.
   *
   * @returns {Number} The number of points per bucket.
   */
  getNumberOfPointsPerBucket(): number;

  /**
   * Get the points in the specified bucket.
   * @param {Vector3} x The point coordinates
   * @returns {Number[]} The points in the bucket
   */
  getPointsInBucket(x: Vector3): number[];

  /**
   * Get the points stored in the point locator.
   *
   * @returns {Nullable<vtkPoints>} The vtkPoints object containing the points.
   */
  getPoints(): Nullable<vtkPoints>;

  /**
   * Initialize point insertion.
   *
   * @param {vtkPoints} points The points to insert
   * @param {Bounds} bounds The bounds for the points
   * @param {Number} estNumPts Estimated number of points for insertion
   */
  initPointInsertion(
    points: vtkPoints,
    bounds: Bounds,
    estNumPts?: number
  ): boolean;

  /**
   * Insert a point into the point locator.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Number} ptId The index of the point to insert.
   * @param {Vector3} x The point to insert.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  insertPoint(ptId: number, x: Vector3): IInsertPointResult;

  /**
   * Insert a point into the point locator.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Vector3} x The point to insert.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  insertNextPoint(x: Vector3): IInsertPointResult;

  /**
   * Insert a point into the point locator.
   * If the point is already present, it returns the existing ID.
   * Otherwise, it inserts the point and returns a new ID.
   *
   * @param {Vector3} x The point to insert.
   * @returns {IInsertPointResult} An object indicating if the point was inserted and its ID.
   */
  insertUniquePoint(x: Vector3): IInsertPointResult;

  /**
   * Check if a point is already inserted in the point locator.
   *
   * @param {Vector3} x The point to check.
   * @returns {Number} The ID of the point if it exists, otherwise -1.
   */
  isInsertedPoint(x: Vector3): number;

  /**
   * Set the divisions of the point locator.
   * @param {Vector3} divisions The number of divisions in each dimension.
   * @returns {Boolean} True if the divisions were set successfully, false otherwise.
   */
  setDivisions(divisions: Vector3): boolean;

  /**
   * Set the divisions of the point locator.
   * @param {Number} x The number of divisions in the x dimension.
   * @param {Number} y The number of divisions in the y dimension.
   * @param {Number} z The number of divisions in the z dimension.
   * @returns {Boolean} True if the divisions were set successfully, false otherwise.
   */
  setDivisions(x: number, y: number, z: number): boolean;

  /**
   * Set the number of points per bucket.
   *
   * @param {Number} numberOfPointsPerBucket The number of points per bucket.
   */
  setNumberOfPointsPerBucket(numberOfPointsPerBucket: number): boolean;

  /**
   * Set the points for this point locator.
   * This is typically used to initialize the locator with a set of points.
   *
   * @param {vtkPoints} points The vtkPoints object containing the points.
   */
  setPoints(points: vtkPoints): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkPointLocator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPointLocatorInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkPointLocator
 * @param {IPointLocatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPointLocatorInitialValues
): vtkPointLocator;

/**
 * vtkPointLocator is a spatial search object to quickly locate points in 3D.
 *
 * vtkPointLocator works by dividing a specified region of space into a regular
 * array of "rectangular" buckets, and then keeping a list of points that lie in
 * each bucket. Typical operation involves giving a position in 3D and finding
 * the closest point.
 *
 * vtkPointLocator has two distinct methods of interaction. In the first method,
 * you supply it with a dataset, and it operates on the points in the dataset.
 * In the second method, you supply it with an array of points, and the object
 * operates on the array.
 */
export declare const vtkPointLocator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkPointLocator;
