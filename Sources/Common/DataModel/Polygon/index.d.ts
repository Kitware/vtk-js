import { vtkObject } from '../../../interfaces';
import { Bounds, TypedArray, Vector3 } from '../../../types';
import vtkPoints from '../../Core/Points';
import { PolygonWithPointIntersectionState } from './Constants';

export interface IPolygonInitialValues {
  firstPoint?: Vector3;
  pointCount?: number;
  tris?: Vector3[];
}

/**
 * Different states which pointInPolygon could return.
 *
 * @deprecated Use {@link PolygonWithPointIntersectionState}, the name the
 * constant actually has at runtime.
 */
export type PolygonIntersectionState = PolygonWithPointIntersectionState;

export interface vtkPolygon extends vtkObject {
  /**
   * Get the array of triangles that triangulate the polygon.
   */
  getPointArray(): Vector3[];

  /**
   * Set the polygon's points.
   * @param {Vector3[]} points The polygon's points.
   */
  setPoints(points: Vector3[]): void;

  /**
   * Triangulate this polygon.
   * The output data must be accessed through `getPointArray`.
   * The output data contains points by group of three: each three-group
   * defines one triangle.
   */
  triangulate(): boolean | null;
}

/**
 * Determine whether a point is inside a polygon. The function uses a winding
 * number calculation generalized to the 3D plane one which the polygon
 * resides. Returns 0 if point is not in the polygon; 1 if it is inside. Can
 * also return -1 to indicate a degenerate polygon. This implementation is
 * inspired by Dan Sunday's algorithm found in the book Practical Geometry
 * Algorithms.
 *
 * @param {Vector3} point Point to check
 * @param {Array<Number>|TypedArray} vertices Vertices of the polygon
 * @param {Bounds} bounds Bounds of the vertices
 * @param {Vector3} normal Normal vector of the polygon
 * @returns {PolygonIntersectionState} Integer indicating the type of intersection
 */
declare function pointInPolygon(
  point: Vector3,
  vertices: Array<number> | TypedArray,
  bounds: Bounds,
  normal: Vector3
): PolygonIntersectionState;

/**
 * Simple utility method for computing polygon bounds.
 * Requires a poly with at least one point.
 *
 * @param {Array<Number>|TypedArray} poly Array of point indices for the polygon
 * @param {vtkPoints} points vtkPoints instance
 * @param {Bounds} bounds Output bounds, filled in place
 * @returns {Number} The sum of the squares of the bounding box dimensions
 */
export function getBounds(
  poly: Array<number> | TypedArray,
  points: vtkPoints,
  bounds: Bounds
): number;

/**
 * Compute the normal of a polygon and return its norm.
 *
 * @param {Array<Number>|TypedArray} poly Array of point indices for the polygon
 * @param {vtkPoints} points vtkPoints instance
 * @param {Vector3} normal Output normal, filled in place
 * @returns {Number} The norm of the computed normal
 */
export function getNormal(
  poly: Array<number> | TypedArray,
  points: vtkPoints,
  normal: Vector3
): number;

/**
 * Compute the centroid of a polygon.
 * @param {Array<number>} poly - Array of point indices for the polygon
 * @param {vtkPoints} points - vtkPoints instance
 * @param {Vector3} [centroid] - Optional output array (length 3)
 * @returns {Vector3} The centroid as [x, y, z]
 */
export function computeCentroid(
  poly: Array<number>,
  points: vtkPoints,
  centroid?: Vector3
): Vector3;

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolygon characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolygonInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPolygonInitialValues
): void;

/**
 * Method used to create a new instance of vtkPolygon.
 * @param {IPolygonInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPolygonInitialValues): vtkPolygon;

/**
 * vtkPolygon represents a 2D n-sided polygon.
 *
 * The polygons cannot have any internal holes, and cannot self-intersect.
 * Define the polygon with n-points ordered in the counter-clockwise direction.
 * Do not repeat the last point.
 */
export declare const vtkPolygon: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  // static
  pointInPolygon: typeof pointInPolygon;
  getBounds: typeof getBounds;
  getNormal: typeof getNormal;
  computeCentroid: typeof computeCentroid;
  // constants
  PolygonWithPointIntersectionState: typeof PolygonWithPointIntersectionState;
};
export default vtkPolygon;
