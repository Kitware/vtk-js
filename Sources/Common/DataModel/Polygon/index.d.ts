import { vtkObject } from "../../../interfaces";
import { Bounds, TypedArray, Vector3 } from "../../../types";
import vtkPoints from "../../Core/Points";
import vtkCell from "../Cell";

export interface IPolygonInitialValues {
	pointCount?: number;
	tris?: Vector3[];
}

/**
 * Different states which pointInPolygon could return.
 */
export enum PolygonWithPointIntersectionState {
	FAILURE,
	OUTSIDE,
	INSIDE,
}

/**
 * Different states that intersectWith2DConvexCell could return.
 */
export enum PolygonWithCellIntersectionState {
	NO_INTERSECTION,
	LINE_INTERSECTION,
	POINT_INTERSECTION,
	OVERLAP,
	INCLUDED
}

interface IIntersectWithLine {
	intersection: boolean;
	betweenPoints: boolean;
	t: number;
	x: Vector3;
}

interface IDistanceToPolygon {
	t: number,
	distance: number
}

export interface vtkPolygon extends vtkObject {
	/**
	 * Set the polygon's points
	 * Points must be ordered in counterclockwise order
	 * @param {Vector3[]|Array<number>} points The polygon's points.
	 * @param {Array<number>} pointIds pointIds 
	 */
	setPoints(points: Vector3[]|Array<number>, pointIds?: Array<number>): void;

	/**
 	 * Get the bounds for this polygon as [xmin, xmax, ymin, ymax, zmin, zmax].
	 * 	@return {Bounds} bounds
	 */
	getBounds(): Bounds

	/**
	 * Computes the polygon normal
	 * @return {number} norm of normal (before normalization)
	 */
	computeNormal(): number;

	/**
	 * Determine whether a point is inside a polygon. The function uses a winding
	 * number calculation generalized to the 3D plane one which the polygon
	 * resides. Returns OUTSIDE if point is not in the polygon; INSIDE if it is inside. Can
	 * also return FAILURE to indicate a degenerate polygon (points non coplanar or on a line).
	 * This implementation is inspired by Dan Sunday's algorithm found in the book Practical
	 * Geometry Algorithms.
	 * @param {Vector3} point Point to check
	 * @return {PolygonWithPointIntersectionState} type of intersection
	 */
	pointInPolygon(point: Vector3): PolygonWithPointIntersectionState;

	/**
	 * Compute ear triangulation of current polygon
	 * The polygon must be convex and have at least 3 points
	 * @return {boolean} whether triangulation failed or not
	 */
	triangulate(): boolean;

	/**
	 * Returns the centroid of this polygon
	 * @return {Vector3} centroid
	 */
	computeCentroid(): Vector3;

	/**
	 * Returns the area of the polygon
	 * @return {number} area
	 */
	computeArea(): number;

	/**
	 * determine the distance from a point to a polygon.
 	* @param {Vector3} x
 	* @param {Vector3} closest filled with the closest point in the polygon
 	* @return {IDistanceToPolygon} object containing the distance (distance) and the tolerance with wich the distance is given (t)
 	*/
	distanceToPolygon(x: Vector3, closest: Vector3): IDistanceToPolygon;

	/**
	 * Returns whether the polygon is convex or not
	 * Returns false for degenerate polygon
	 * @return {boolean} is convex or not
	 */
	isConvex(): boolean;

	/**
	 * Interpolates functions with polygon points
	 * @param {Vector3} point point to compute the interpolation on
	 * @param {boolean} useMVCInterpolation
	 * @return weights corresponding to each point of polygon parametrizing the given point
	 */
	interpolateFunctions(
		point: Vector3,
		useMVCInterpolation: boolean
	): number[];

	/**
	 * Computes intersection of polygon with a line defined by two points
	 * @param {Vector3} x1 first point of line
	 * @param {Vector3} x2 second point of line
	 * @return intersection point coordinates
	 */
	intersectWithLine(x1: Vector3, x2: Vector3): IIntersectWithLine;

	/**
	 * Computes intersection of polygon with another cell.
	 * It can be a line, a point, no intersection or coincident
	 * Note: Expects both polygons/cell to be convex
	 * @param {vtkCell} cell polygon or any object extending from vtkCell with which to compute intersection
	 * Note : the function intersectWithLine need to be implemented on the class of the cell given
	 * @return {PolygonWithCellIntersectionState} type of intersection
	 */
	intersectConvex2DCells(
		cell: vtkCell
	): PolygonWithCellIntersectionState;
}

// ---------------------------------------------------
/**
 * Compute the normal of a polygon and return its squared norm.
 * @param {vtkPoints} points
 * @param {Vector3} normal
 * @return {number}
 */
export function getNormal(
	points: vtkPoints,
	normal: Vector3
): number;

/**
 * Get the bounds for these points as [xmin, xmax, ymin, ymax,zmin, zmax].
 * @param {vtkPoints} points
 * @return {Bounds}
 */
export function getBounds(points: vtkPoints): Bounds;

/**
 * Determines whether a polygon is convex
 * @param {vtkPoints} points vtkPoints defining the polygon
 * @return {boolean} whether the polygon is convex or not
 */
export function isConvex(points: vtkPoints): boolean;

/**
 * Given a set of points, computes the centroid of the corresponding polygon
 * @param {vtkPoints} points vtkPoints defining the polygon
 * @param {Vector3} normal normal to the polygon of which the centroid is computed
 * @return {Vector3} centroid. Returns null for degenerate polygon
 */
export function computeCentroid(points: vtkPoints, normal: Vector3): Vector3;

/**
 * Given a set of points, computes the area of the corresponding polygon
 * @param {vtkPoints} points vtkPoints defining the polygon
 * @param {Vector3} normal normal to the polygon of which the centroid is computed
 * @return {number} area of polygon
 */
export function computeArea(points: vtkPoints, normal: Vector3): number;

/**
 * Given a set of points, determine the distance from a point to a polygon.
 * @param {Vector3} x
 * @param {vtkPoints} points vtkPoints defining the polygon
 * @param {Vector3} closest filled with the closest point in the polygon
 * @return {IDistanceToPolygon} object containing the distance (distance) and the tolerance with wich the distance is given (t)
 */
export function distanceToPolygon(x: Vector3, points: vtkPoints, closest: Vector3): IDistanceToPolygon;

/**
 * Determine whether a point is inside a polygon. The function uses a winding
 * number calculation generalized to the 3D plane one which the polygon
 * resides. Returns OUTSIDE if point is not in the polygon; INSIDE if it is inside. Can
 * also return FAILURE to indicate a degenerate polygon. This implementation is
 * inspired by Dan Sunday's algorithm found in the book Practical Geometry
 * Algorithms.
 *
 * @param {Vector3} point Point to check
 * @param {Array<number>|TypedArray} vertices Vertices of the polygon
 * @param {Bounds} bounds Bounds of the vertices
 * @param {Vector3} normal Normal vector of the polygon
 * @return {PolygonWithPointIntersectionState} Integer indicating the type of intersection
 */
export function pointInPolygon(
	point: Vector3,
	vertices: Array<number> | TypedArray,
	bounds: Bounds,
	normal: Vector3
): PolygonWithPointIntersectionState;

/**
 * Given a set of points that define a polygon, determines whether a line defined
 * by two points intersect with the polygon. There can be no intersection, a point
 * intersection or a line intersection.
 * @param {Vector3} p1 first point of the line
 * @param {Vector3} p2 second point of the line
 * @param {vtkPoints} points points defining the polygon
 * @param {Vector3} normal normal to the polygon
 * @return {IIntersectWithLine} type of intersection
 */
export function intersectWithLine(
	p1: Vector3,
	p2: Vector3,
	points: vtkPoints,
	normal: Vector3
): IIntersectWithLine;

/**
 * Given a set of points that define a polygon and another polygon, computes their
 * intersection. It can be a line, a point, no intersection or coincident
 * Note: Expects both polygons need to be convex
 * @param {vtkCell} cell polygon or any object extending from vtkCell with which to compute intersection
 * Note : the function intersectWithLine need to be implemented on the class of the cell given
 * @param {vtkPoints} points points defining the polygon
 * @param {Vector3} normal normal to the polygon
 * @return {PolygonWithCellIntersectionState} type of intersection
 */
export function intersectConvex2DCells(
	cell: vtkCell,
	points: vtkPoints,
	normal: Vector3
): PolygonWithCellIntersectionState;

/**
 * Given a set of points, computes the weights corresponding to the interpolation of the
 * given point with regard to the points of the polygon. The returned array corresponds to
 * the weights and therefore its size is the number of points in the polygon
 * @param {Vector3} point point we want the interpolation of
 * @param {vtkPoints} points points defining the polygon
 * @param {boolean} useMVCInterpolation whether to use MVC interpolation
 */
export function interpolateFunctions(
	point: Vector3,
	points: vtkPoints,
	useMVCInterpolation: boolean
): Array<number>;

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
};
export default vtkPolygon;
