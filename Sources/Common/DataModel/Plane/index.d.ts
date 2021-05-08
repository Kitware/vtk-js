import { vtkObject } from "vtk.js/Sources/interfaces" ;

/**
 *
 */
interface IPlaneInitialValues {
	normal?: number[];
	origin?: number[];
}

interface IIntersectWithLine {
	intersection: boolean;
	betweenPoints: boolean;
	t: number;
	x: number[];
}


export interface vtkPlane extends vtkObject {

	/**
	 * Return the distance of a point x to a plane defined by n (x-p0) = 0.
	 * The normal n must be magnitude = 1.
	 * @param {Number[]} x 
	 */
	distanceToPlane(x: number[]): number;

	/**
	 * Get plane normal.
	 * Plane is defined by point and normal.
	 */
	getNormal(): number[];

	/**
	 * Get plane normal.
	 * Plane is defined by point and normal.
	 */
	getNormalByReference(): number[];

	/**
	 * Get the origin of the plane
	 */
	getOrigin(): number[];

	/**
	 * Get the origin of the plane
	 */
	getOriginByReference(): number[];

	/**
	 * 
	 * @param {Number[]} x 
	 * @param {Number[]} xproj 
	 */
	projectPoint(x: number[], xproj: number[]): void;

	/**
	 * Project a vector v onto plane. The projected vector is returned in vproj.
	 * @param {Number[]} v 
	 * @param {Number[]} vproj 
	 */
	projectVector(v: number[], vproj: number[]): void;

	/**
	 * Translate the plane in the direction of the normal by the distance
	 * specified. Negative values move the plane in the opposite direction.
	 * @param {Number} distance 
	 */
	push(distance: number): void;

	/**
	 * 
	 * @param {Number[]} x 
	 * @param {Number[]} xproj 
	 */
	generalizedProjectPoint(x: number[], xproj: number[]): void;

	/**
	 * Evaluate plane equation for point x.
	 * 
	 * Accepts both an array point representation and individual xyz arguments.
	 * 
	 * ```js
	 * plane.evaluateFunction([0.0, 0.0, 0.0]);
	 * plane.evaluateFunction(0.0, 0.0, 0.0);
	 * ```
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	evaluateFunction(x: number, y: number, z: number): number;

	/**
	 * Evaluate plane equation for point x.
	 * 
	 * Accepts both an array point representation and individual xyz arguments.
	 * 
	 * ```js
	 * plane.evaluateFunction([0.0, 0.0, 0.0]);
	 * plane.evaluateFunction(0.0, 0.0, 0.0);
	 * ```
	 * @param {Number[]} value 
	 */
	evaluateFunction(value: number[]): number;

	/**
	 * Given the point xyz (three floating values) evaluate the equation for the
	 * plane gradient. Note that the normal and origin must have already been
	 * specified. The method returns an array of three floats.
	 * @param {Number} xyz 
	 */
	evaluateGradient(xyz: any): number[];

	/**
	 * Given a line defined by the two points p1,p2; and a plane defined by the
	 * normal n and point p0, compute an intersection. Return an object:
	 *
	 * ```js
	 * let obj = {intersection: ..., betweenPoints: ..., t: ..., x: ...};
	 * ```
	 *
	 * where:
	 * - **intersection** (_boolean_): indicates if the plane and line
	 *   intersect.
	 * - **betweenPoints** (_boolean_): indicates if the intersection is between
	 *   the provided points. True if (0 <= t <= 1), and false otherwise.
	 * - **t** (_Number_): parametric coordinate along the line.
	 * - **x** (_Array_): coordinates of intersection.
	 *
	 * If the plane and line are parallel, intersection is false and t is set to
	 * Number.MAX_VALUE.
	 * @param {Number[]} p1 
	 * @param {Number[]} p2 
	 * @return {IIntersectWithLine} 
	 */
	intersectWithLine(p1: number[], p2: number[]): IIntersectWithLine;

	/**
	 * Given a planes defined by the normals n0 & n1 and origin points p0 & p1,
	 * compute the line representing the plane intersection. Return an object:
	 *
	 * ```js
	 * let obj = {intersection: ..., error: ..., l0: ..., l1: ...};
	 * ```
	 *
	 * where:
	 *
	 * - **intersection** (_boolean_): indicates if the two planes intersect.
	 *   Intersection is true if (0 <= t <= 1), and false otherwise.
	 * - **l0** (_Array_): coordinates of point 0 of the intersection line.
	 * - **l1** (_Array_): coordinates of point 1 of the intersection line.
	 * - **error** (_String|null_): Conditional, if the planes do not intersect,
	 *   is it because they are coplanar (`COINCIDE`) or parallel (`DISJOINT`).
	 * @param {Number[]} planeOrigin 
	 * @param {Number[]} planeNormal 
	 */
	intersectWithPlane(planeOrigin: number[], planeNormal: number[]): IIntersectWithLine;

	/**
	 * Set the normal of the plane.
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal object.
	 * @param {Number[]} normal The normal coordinate.
	 */
	setNormalFrom(normal: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number[]} origin The coordinate of the origin point.
	 */
	setOrigin(origin: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number} x The x coordinate of the origin point.
	 * @param {Number} y The y coordinate of the origin point.
	 * @param {Number} z The z coordinate of the origin point.
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number[]} origin The coordinate of the origin point.
	 */
	setOriginFrom(origin: number[]): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPlane characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPlaneInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPlaneInitialValues): void;

/**
 * Method used to create a new instance of vtkPlane.
 * @param {IPlaneInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPlaneInitialValues): vtkPlane;

/**
 * Quick evaluation of plane equation n(x-origin) = 0.
 * @static
 * @param {Number[]} normal 
 * @param {Number[]} origin 
 * @param {Number[]} x 
 * @return {Number} 
 */
export function evaluate(normal: number[], origin: number[], x: number[]): number;

/**
 * Return the distance of a point x to a plane defined by n (x-p0) = 0.
 * The normal n must be magnitude = 1.
 * @static
 * @param {Number[]} x 
 * @param {Number[]} origin 
 * @param {Number[]} normal 
 * @return {Number} 
 */
export function distanceToPlane(x: number[], origin: number[], normal: number[]): number;

/**
 * Project a point x onto plane defined by origin and normal. The projected point
 * is returned in xproj.
 * !!! note
 *     normal assumed to have magnitude 1.
 * @static
 * @param {Number[]} x 
 * @param {Number[]} origin 
 * @param {Number[]} normal 
 * @param {Number[]} xproj 
 */
export function projectPoint(x: any, origin: number[], normal: number[], xproj: number[]): void;

/**
 * Project a vector v onto a plane defined by a normal. The projected vector is
 * returned in vproj.
 * @static
 * @param {Number[]} v 
 * @param {Number[]} normal 
 * @param {Number[]} vproj 
 */
export function projectVector(v: number[], normal: number[], vproj: number[],): void;

/**
 * Project a point x onto plane defined by origin and normal. The projected
   point is returned in xproj. 
 * 
 * !!! note
 *     normal does NOT have to have magnitude 1.
 * @static
 * @param {Number[]} x 
 * @param {Number[]} origin 
 * @param {Number[]} normal 
 * @param {Number[]} xproj 
 */
export function generalizedProjectPoint(x: any, origin: number[], normal: number[], xproj: number[]): void;

/**
 * Given a line defined by the two points p1,p2; and a plane defined by the normal n and point p0, compute an intersection.
 * Return an object:
 * 
 * ```js
 * let obj = {intersection: ..., betweenPoints: ..., t: ..., x: ...};
 * ```
 * 
 * where:
 * - **intersection** (_boolean_): indicates if the plane and line intersect.
 * - **betweenPoints** (_boolean_): indicates if the intersection is between the provided points. True if (0 <= t <= 1), and false otherwise.
 * - **t** (_Number_): parametric coordinate along the line.
 * - **x** (_Array_): coordinates of intersection.
 * 
 * If the plane and line are parallel, intersection is false and t is set to
 * Number.MAX_VALUE.
 * @static
 * @param {Number[]} p1 
 * @param {Number[]} p2 
 * @param {Number[]} origin 
 * @param {Number[]} normal 
 * @return {IIntersectWithLine} 
 */
export function intersectWithLine(p1: number[], p2: number[], origin: number[], normal: number[]): IIntersectWithLine;


/**
 *  Given a planes defined by the normals n0 & n1 and origin points p0 & p1,
 *  compute the line representing the plane intersection. Return an object:
 * 
 *  ```js
 *  let obj = {intersection: ..., error: ..., l0: ..., l1: ...};
 *  ```
 * 
 *  where:
 * 
 *  - **intersection** (_boolean_): indicates if the two planes intersect.
 *    Intersection is true if (0 <= t <= 1), and false otherwise.
 *  - **l0** (_Array_): coordinates of point 0 of the intersection line.
 *  - **l1** (_Array_): coordinates of point 1 of the intersection line.
 *  - **error** (_String|null_): Conditional, if the planes do not intersect,
 *    is it because they are coplanar (`COINCIDE`) or parallel (`DISJOINT`).
 * @static
 * @param {Number[]} plane1Origin 
 * @param {Number[]} plane1Normal 
 * @param {Number[]} plane2Origin 
 * @param {Number[]} plane2Normal 
 * @return {IIntersectWithLine} 
 */
export function intersectWithPlane(plane1Origin: number[], plane1Normal: number[], plane2Origin: number[], plane2Normal: number[]): IIntersectWithLine;

/**
 * Constants for the `intersectWithPlane` function.
 */
export declare const COINCIDE: string;

/**
 * Constants for the `intersectWithPlane` function.
 */
export declare const DISJOINT: string;

/**
 * vtkPlane provides methods for various plane computations. These include
 * projecting points onto a plane, evaluating the plane equation, and returning
 * plane normal.
 */
export declare const vtkPlane: {
	newInstance: typeof newInstance,
	extend: typeof extend,
	evaluate: typeof evaluate,
	distanceToPlane: typeof distanceToPlane,
	projectPoint: typeof projectPoint,
	projectVector: typeof projectVector,
	generalizedProjectPoint: typeof generalizedProjectPoint,
	intersectWithLine: typeof intersectWithLine,
	intersectWithPlane: typeof intersectWithPlane,
};
export default vtkPlane;
