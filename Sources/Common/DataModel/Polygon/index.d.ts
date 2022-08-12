import { vtkObject } from "../../../interfaces";
import { Bounds, TypedArray, Vector3 } from "../../../types";

export interface IPolygonInitialValues {
	firstPoint?: Vector3,
	pointCount?: number,
	tris?: Vector3[],
}

/**
 * Different states which pointInPolygon could return.
 */
export enum PolygonIntersectionState {
	FAILURE,
	OUTSIDE,
	INSIDE,
	INTERSECTION,
	ON_LINE,
}

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
	triangulate(): void;

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
export function pointInPolygon(
  point: Vector3,
  vertices: Array<number>|TypedArray,
  bounds: Bounds,
  normal: Vector3
): PolygonIntersectionState;

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolygon characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolygonInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPolygonInitialValues): void;

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
	newInstance: typeof newInstance,
	extend: typeof extend;
	// static

};
export default vtkPolygon;
