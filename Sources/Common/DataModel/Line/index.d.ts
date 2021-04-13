import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';

export enum IntersectionState {
	NO_INTERSECTION,
	YES_INTERSECTION,
	ON_LINE,
}

interface ILineInitialValues { }

interface IIntersectWithLine {
	intersect: number;
	t: number;
	subId: number;
}

interface IDistanceToLine {
	t: number;
	distance: number;
}

export interface vtkLine extends vtkCell {

	/**
	 * 
	 */
	getCellDimension(): number;

	/**
	 * Compute the intersection point of the intersection between line and line
	 * defined by p1 and p2. tol Tolerance use for the position evaluation x is
	 * the point which intersect triangle (computed in function) pcoords
	 * parametric coordinates (computed in function) A javascript object is
	 * returned :
	 * ```js
	 * {
	 *   evaluation: define if the triangle has been intersected or not
	 *   subId: always set to 0
	 *   t: tolerance of the intersection
	 * }
	 * ```
	 * @param p1 
	 * @param p2 
	 * @param tol 
	 * @param x 
	 * @param pcoords 
	 * @return {IIntersectWithLine} 
	 */
	intersectWithLine(p1: number[], p2: number[], tol: number, x: number[], pcoords: number[]): IIntersectWithLine;

	/**
	 * 
	 * @param x 
	 * @param closestPoint 
	 * @param subId 
	 * @param pcoords 
	 * @param dist2 
	 * @param weights 
	 */
	evaluatePosition(x: any, closestPoint: any, subId: any, pcoords: any, dist2: any, weights: any): void;
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
 * ```js
 * {
 *   t: tolerance of the distance
 *   distance: quared distance between closest point and x
 * }
 * @param {Number[]} x 
 * @param {Number[]} p1 
 * @param {Number[]} p2 
 * @param {Number[]} [closestPoint] 
 */
export function distanceToLine(x: number[], p1: number[], p2: number[], closestPoint?: number[]): IDistanceToLine;

/**
 * Performs intersection of two finite 3D lines. An intersection is found if the
 * projection of the two lines onto the plane perpendicular to the cross product
 * of the two lines intersect, and if the distance between the closest * points
 * of approach are within a relative tolerance. The parameters (u,v) are the
 * parametric coordinates of the lines at the position of closest approach.
 * Careful, u and v are filled inside the function. Outside the function, they
 * have to be access with : u[0] and v[0] return IntersectionState enum
 * :
 * ```js
 * enum IntersectionState {
 *    NO_INTERSECTION,
 *    YES_INTERSECTION,
 *    ON_LINE
 * }
 * @param  {Number[]} a1 
 * @param {Number[]} a2 
 * @param {Number[]} b1 
 * @param {Number[]} b2 
 * @param {Number[]} u 
 * @param {Number[]} v 
 */
export function intersection(a1: number[], a2: number[], b1: number[], b2: number[], u: number[], v: number[]): IntersectionState;

/** 
 * vtkLine is a cell which representant a line.
 * It contains static method to make some computations directly link to line.
 * @see vtkCell
 */
export declare const vtkLine: {
	newInstance: typeof newInstance,
	extend: typeof extend;
	distanceToLine: typeof distanceToLine;
	intersection: typeof intersection;
};
export default vtkLine;
