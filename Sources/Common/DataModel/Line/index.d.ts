import { Vector3, Vector2 } from '../../../types';
import vtkCell from '../Cell';

export enum IntersectionState {
	NO_INTERSECTION,
	YES_INTERSECTION,
	ON_LINE,
}

interface ILineInitialValues { }

export interface IIntersectWithLine {
	intersect: number;
	t: number;
	subId: number;
	evaluation?: number;
	betweenPoints?: boolean;
}

interface IDistanceToLine {
	t: number;
	distance: number;
}

export interface vtkLine extends vtkCell {

	/**
	 * Get the topological dimensional of the cell (0, 1, 2 or 3).
	 */
	getCellDimension(): number;

	/**
	 * Compute the intersection point of the intersection between line and line
	 * defined by p1 and p2. tol Tolerance use for the position evaluation x is
	 * the point which intersect triangle (computed in function) pcoords
	 * parametric coordinates (computed in function) A javascript object is
	 * returned :
	 * 
	 * ```js
	 * {
	 *   evaluation: define if the line has been intersected or not
	 *   subId: always set to 0
	 *   t: tolerance of the intersection
	 * }
	 * ```
	 * @param {Vector3} p1 The first point coordinate.
	 * @param {Vector3} p2 The second point coordinate.
	 * @param {Number} tol The tolerance to use.
	 * @param {Vector3} x The point which intersect triangle.
	 * @param {Vector3} pcoords The parametric coordinates.
	 */
	intersectWithLine(p1: Vector3, p2: Vector3, tol: number, x: Vector3, pcoords: Vector3): IIntersectWithLine;

	/**
	 * Determine the global coordinates `x' and parametric coordinates `pcoords' in the cell.
	 */
	evaluateLocation(pcoords: Vector3, x: Vector3, weights: Vector2): void
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLine characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILineInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineInitialValues): void;

/**
 * Method used to create a new instance of vtkLine.
 * @param {ILineInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILineInitialValues): vtkLine;

/**
 * Compute the distance from x to the line composed by p1 and p2. If an object
 * is set as a fourth argument, then the closest point on the line from x will
 * be set into it.
 * 
 * ```js
 * {
 *   t: tolerance of the distance
 *   distance: quared distance between closest point and x
 * }
 * ```
 * @static
 * @param {Vector3} x 
 * @param {Vector3} p1 
 * @param {Vector3} p2 
 * @param {Vector3} [closestPoint] 
 */
export function distanceToLine(x: Vector3, p1: Vector3, p2: Vector3, closestPoint?: Vector3): IDistanceToLine;

/**
 * Performs intersection of two finite 3D lines. An intersection is found if the
 * projection of the two lines onto the plane perpendicular to the cross product
 * of the two lines intersect, and if the distance between the closest * points
 * of approach are within a relative tolerance. The parameters (u,v) are the
 * parametric coordinates of the lines at the position of closest approach.
 * Careful, u and v are filled inside the function. Outside the function, they
 * have to be access with : u[0] and v[0] return IntersectionState enum :
 * 
 * ```js
 * enum IntersectionState {
 *    NO_INTERSECTION,
 *    YES_INTERSECTION,
 *    ON_LINE
 * }
 * ```
 * @static
 * @param  {Vector3} a1 
 * @param {Vector3} a2 
 * @param {Vector3} b1 
 * @param {Vector3} b2 
 * @param {Vector3} u 
 * @param {Vector3} v 
 */
export function intersection(a1: Vector3, a2: Vector3, b1: Vector3, b2: Vector3, u: Vector3, v: Vector3): IntersectionState;

/** 
 * vtkLine is a cell which representant a line.
 * It contains static method to make some computations directly link to line.
 * 
 * @see vtkCell
 */
export declare const vtkLine: {
	newInstance: typeof newInstance,
	extend: typeof extend;
	distanceToLine: typeof distanceToLine;
	intersection: typeof intersection;
};
export default vtkLine;
