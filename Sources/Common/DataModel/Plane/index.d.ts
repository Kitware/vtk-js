import { vtkObject } from "../../../interfaces" ;
import { Vector3 } from "../../../types";

/**
 *
 */
export interface IPlaneInitialValues {
	normal?: Vector3;
	origin?: Vector3;
}

interface IIntersectWithLine {
	intersection: boolean;
	betweenPoints: boolean;
	t: number;
	x: Vector3;
}


export interface vtkPlane extends vtkObject {

	/**
	 * Get the distance of a point x to a plane defined by n (x-p0) = 0.
	 * The normal n must be magnitude = 1.
	 * @param {Vector3} x The point coordiante.
	 */
	distanceToPlane(x: Vector3): number;

	/**
	 * Get plane normal.
	 * Plane is defined by point and normal.
	 */
	getNormal(): Vector3;

	/**
	 * Get plane normal.
	 * Plane is defined by point and normal.
	 */
	getNormalByReference(): Vector3;

	/**
	 * Get the origin of the plane
	 */
	getOrigin(): Vector3;

	/**
	 * Get the origin of the plane
	 */
	getOriginByReference(): Vector3;

	/**
	 * 
	 * @param {Vector3} x The point coordinate.
	 * @param {Vector3} xproj The projection point's coordinate.
	 */
	projectPoint(x: Vector3, xproj: Vector3): void;

	/**
	 * Project a vector v onto plane. The projected vector is returned in vproj.
	 * @param {Vector3} v The vector coordinate.
	 * @param {Vector3} vproj The projection vector's coordinate..
	 */
	projectVector(v: Vector3, vproj: Vector3): void;

	/**
	 * Translate the plane in the direction of the normal by the distance
	 * specified. Negative values move the plane in the opposite direction.
	 * @param {Number} distance 
	 */
	push(distance: number): void;

	/**
	 * 
	 * @param {Vector3} x The point coordinate.
	 * @param {Vector3} xproj The projection point's coordinate.
	 */
	generalizedProjectPoint(x: Vector3, xproj: Vector3): void;

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
	 * @param {Vector3} value 
	 */
	evaluateFunction(value: Vector3): number;

	/**
	 * Given the point xyz (three floating values) evaluate the equation for the
	 * plane gradient. Note that the normal and origin must have already been
	 * specified. The method returns an array of three floats.
	 * @param xyz 
	 */
	evaluateGradient(xyz: any): Vector3;

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
	 * @param {Vector3} p1 The first point coordiante.
	 * @param {Vector3} p2 The second point coordiante.
	 */
	intersectWithLine(p1: Vector3, p2: Vector3): IIntersectWithLine;

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
	 * @param {Vector3} planeOrigin 
	 * @param {Vector3} planeNormal 
	 */
	intersectWithPlane(planeOrigin: Vector3, planeNormal: Vector3): IIntersectWithLine;

	/**
	 * Set the normal of the plane.
	 * @param {Vector3} normal The normal coordinate.
	 */
	setNormal(normal: Vector3): boolean;

	/**
	 * Set the normal of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal object.
	 * @param {Vector3} normal The normal coordinate.
	 */
	setNormalFrom(normal: Vector3): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Vector3} origin The coordinate of the origin point.
	 */
	setOrigin(origin: Vector3): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number} x The x coordinate of the origin point.
	 * @param {Number} y The y coordinate of the origin point.
	 * @param {Number} z The z coordinate of the origin point.
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Vector3} origin The coordinate of the origin point.
	 */
	setOriginFrom(origin: Vector3): boolean;
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
 * @param {Vector3} normal 
 * @param {Vector3} origin The coordinate of the origin point.
 * @param {Vector3} x 
 */
export function evaluate(normal: Vector3, origin: Vector3, x: Vector3): number;

/**
 * Return the distance of a point x to a plane defined by n (x-p0) = 0.
 * The normal n must be magnitude = 1.
 * @static
 * @param {Vector3} x 
 * @param {Vector3} origin The coordinate of the origin point.
 * @param {Vector3} normal 
 */
export function distanceToPlane(x: Vector3, origin: Vector3, normal: Vector3): number;

/**
 * Project a point x onto plane defined by origin and normal. The projected point
 * is returned in xproj.
 * !!! note
 *     normal assumed to have magnitude 1.
 * @static
 * @param {Vector3} x 
 * @param {Vector3} origin The coordinate of the origin point.
 * @param {Vector3} normal 
 * @param {Vector3} xproj 
 */
export function projectPoint(x: any, origin: Vector3, normal: Vector3, xproj: Vector3): void;

/**
 * Project a vector v onto a plane defined by a normal. The projected vector is
 * returned in vproj.
 * @static
 * @param {Vector3} v The vector coordinate.
 * @param {Vector3} normal 
 * @param {Vector3} vproj The projection vector's coordinate..
 */
export function projectVector(v: Vector3, normal: Vector3, vproj: Vector3,): void;

/**
 * Project a point x onto plane defined by origin and normal. The projected
   point is returned in xproj. 
 * 
 * !!! note
 *     normal does NOT have to have magnitude 1.
 * @static
 * @param {Vector3} x 
 * @param {Vector3} origin The coordinate of the origin point.
 * @param {Vector3} normal 
 * @param {Vector3} xproj 
 */
export function generalizedProjectPoint(x: any, origin: Vector3, normal: Vector3, xproj: Vector3): void;

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
 * @param {Vector3} p1 
 * @param {Vector3} p2 
 * @param {Vector3} origin The coordinate of the origin point.
 * @param {Vector3} normal 
 */
export function intersectWithLine(p1: Vector3, p2: Vector3, origin: Vector3, normal: Vector3): IIntersectWithLine;


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
 * @param {Vector3} plane1Origin 
 * @param {Vector3} plane1Normal 
 * @param {Vector3} plane2Origin 
 * @param {Vector3} plane2Normal 
 */
export function intersectWithPlane(plane1Origin: Vector3, plane1Normal: Vector3, plane2Origin: Vector3, plane2Normal: Vector3): IIntersectWithLine;

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
