import { Vector3 } from '../../../types';
import vtkCell, { ICellInitialValues } from '../Cell';

export interface ITriangleInitialValues extends ICellInitialValues {}

interface IIntersectWithLine {
	intersect: number;
	t: number;
	subId: number;
	evaluation?: number;
	betweenPoints?: boolean;
}

export interface vtkTriangle extends vtkCell {

	/**
	 * Get the topological dimensional of the cell (0, 1, 2 or 3).
	 */
	getCellDimension(): number;

	/**
	 * Compute the intersection point of the intersection between triangle and
	 * line defined by p1 and p2. tol Tolerance use for the position evaluation
	 * x is the point which intersect triangle (computed in function) pcoords
	 * parametric coordinates (computed in function) A javascript object is
	 * returned :
	 *
	 * ```js
	 * {
	 *    evaluation: define if the triangle has been intersected or not
	 *    subId: always set to 0
	 *    t: parametric coordinate along the line.
	 *    betweenPoints: Define if the intersection is between input points
	 * }
	 * ```
	 * 
	 * @param {Vector3} p1 The first point coordinate.
	 * @param {Vector3} p2 The second point coordinate.
	 * @param {Number} tol The tolerance to use.
	 * @param {Vector3} x The point which intersect triangle.
	 * @param {Vector3} pcoords The parametric coordinates.
	 */
	intersectWithLine(p1: Vector3, p2: Vector3, tol: number, x: Vector3, pcoords: Vector3): IIntersectWithLine;

	/**
	 * Evaluate the position of x in relation with triangle. 
	 * 
	 * Compute the closest point in the cell. 
	 * - pccords parametric coordinate (computed in function)
	 * - weights Interpolation weights in cell. 
	 * - the number of weights is equal to the number of points defining the
	 *   cell (computed in function). 
	 * 
	 * A javascript object is returned :
	 * 
	 * ```js
	 * {
	 *   evaluation: 1 = inside 0 = outside -1 = problem during execution
	 *   subId: always set to 0
	 *   dist2: squared distance from x to cell
	 * }
	 * ```
	 * 
	 * @param {Vector3} x The x point coordinate.
	 * @param {Vector3} closestPoint The closest point coordinate.
	 * @param {Vector3} pcoords The parametric coordinates.
	 * @param {Number[]} weights The number of weights.
	 */
	evaluatePosition(x: Vector3, closestPoint: Vector3, pcoords: Vector3, weights: number[]): IIntersectWithLine

	/**
	 * Determine global coordinate (x]) from subId and parametric coordinates.
	 * @param {Vector3} pcoords The parametric coordinates.
	 * @param {Vector3} x The x point coordinate.
	 * @param {Number[]} weights The number of weights.
	 */
	evaluateLocation(pcoords: Vector3, x: Vector3, weights: number[]): void;

	/**
	 * Get the distance of the parametric coordinate provided to the cell.
	 * @param {Vector3} pcoords The parametric coordinates.
	 */
	getParametricDistance(pcoords: Vector3): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTriangle characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITriangleInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITriangleInitialValues): void;

/**
 * Method used to create a new instance of vtkTriangle.
 * @param {ITriangleInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITriangleInitialValues): vtkTriangle;


/**
 * Compute the normal direction according to the three vertex which composed a
 * triangle. The normal is not normalized. The normal is returned in normal.
 * @param {Vector3} v1 The first point coordinate.
 * @param {Vector3} v2 The second point coordinate.
 * @param {Vector3} v3 The third point coordinate.
 * @param {Vector3} n The normal coordinate.
 */
export function computeNormalDirection(v1: Vector3, v2: Vector3, v3: Vector3, n: Vector3): void;

/**
 * Compute the normalized normal of a triangle composed of three points. The
 * normal is returned in normal.
 * @param {Vector3} v1 The first point coordinate.
 * @param {Vector3} v2 The second point coordinate.
 * @param {Vector3} v3 The third point coordinate.
 * @param {Vector3} n The normal coordinate.
 */
export function computeNormal(v1: Vector3, v2: Vector3, v3: Vector3, n: Vector3): void;

/**
 * vtkTriangle is a cell which representant a triangle. It contains static
 * method to make some computations directly link to triangle.
 * 
 * @see vtkCell
 */
export declare const vtkTriangle: {
	newInstance: typeof newInstance,
	extend: typeof extend;
	computeNormalDirection: typeof computeNormalDirection;
	computeNormal: typeof computeNormal;
};
export default vtkTriangle;
