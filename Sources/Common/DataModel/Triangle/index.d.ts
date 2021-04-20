import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';

interface ITriangleInitialValues { }

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
	 * @param {Number[]} p1 The first point coordinate.
	 * @param {Number[]} p2 The second point coordinate.
	 * @param {Number} tol The tolerance to use.
	 * @param {Number[]} x is the point which intersect triangle
	 * @param {Number[]} pcoords The parametric coordinates.
	 */
	intersectWithLine(p1: number[], p2: number[], tol: number, x: number[], pcoords: number[]): IIntersectWithLine;

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
	 * @param {Number[]} x 
	 * @param {Number[]} closestPoint 
	 * @param {Number[]} pcoords The parametric coordinates.
	 * @param {Number[]} weights The number of weights.
	 */
	evaluatePosition(x: number[], closestPoint: number[], pcoords: number[], weights: number[]): IIntersectWithLine

	/**
	 * Determine global coordinate (x]) from subId and parametric coordinates.
	 * @param {Number[]} pcoords The parametric coordinates.
	 * @param {Number[]} x 
	 * @param {Number[]} weights The number of weights.
	 */
	evaluateLocation(pcoords: number[], x: number[], weights: number[]): void;

	/**
	 * Get the distance of the parametric coordinate provided to the cell.
	 * @param {Number[]} pcoords The parametric coordinates.
	 */
	getParametricDistance(pcoords: number[]): number;
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
 * @param {Number[]} v1 The first point coordinate.
 * @param {Number[]} v2 The second point coordinate.
 * @param {Number[]} v3 The third point coordinate.
 * @param {Number[]} n The normal coordinate.
 */
export function computeNormalDirection(v1: number[], v2: number[], v3: number[], n: number[]): void;

/**
 * Compute the normalized normal of a triangle composed of three points. The
 * normal is returned in normal.
 * @param {Number[]} v1 The first point coordinate.
 * @param {Number[]} v2 The second point coordinate.
 * @param {Number[]} v3 The third point coordinate.
 * @param {Number[]} n The normal coordinate.
 */
export function computeNormal(v1: number[], v2: number[], v3: number[], n: number[]): void;

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
