import { vtkObject } from "../../../interfaces" ;
import { Bounds, Vector3 } from "../../../types";


export interface ISphereInitialValues {
	radius?: number;
	center?: Vector3;
}

export interface vtkSphere extends vtkObject {

	/**
	 * Given the point xyz (three floating value) evaluate the sphere
	 * equation.
	 * @param {Vector3} xyz The point coordinate.
	 */
	evaluateFunction(xyz: Vector3): number[];

	/**
	 * Given the point xyz (three floating values) evaluate the equation for the
	 * sphere gradient.
	 * @param {Vector3} xyz The point coordinate.
	 */
	evaluateGradient(xyz: Vector3): number[];

	/**
	 * Get the center of the sphere.
	 */
	getCenter(): Vector3;

	/**
	 * Get the center of the sphere.
	 */
	getCenterByReference(): Vector3;

	/**
	 * Get the radius of the sphere.
	 */
	getRadius(): number;

	/**
	 * Set the center of the sphere.
	 * @param {Vector3} center The center coordinate.
	 */
	setCenter(center: Vector3): boolean;

	/**
	 * Set the center of the sphere.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the sphere.
	 * @param {Vector3} center The center coordinate.
	 */
	setCenterFrom(center: Vector3): boolean;

	/**
	 * Set the radius of the sphere.
	 * @param {Number} radius The radius of the sphere.
	 */
	setRadius(radius: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSphere characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISphereInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISphereInitialValues): void;

/**
 * Method used to create a new instance of vtkSphere.
 * @param {ISphereInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISphereInitialValues): vtkSphere;

/**
* @param {Number} radius 
* @param {Vector3} center 
* @param {Vector3} x 
*/
declare function evaluate(radius: number, center: Vector3, x: Vector3): number;

/**
* 
* @param {Vector3} point 
* @param {Bounds} bounds 
*/
declare function isPointIn3DEllipse(point: Vector3, bounds: Bounds): boolean;

/**
 * vtkSphere provides methods for creating a 1D cubic spline object from given
 * parameters, and allows for the calculation of the spline value and derivative
 * at any given point inside the spline intervals.
 */
export declare const vtkSphere: {
	newInstance: typeof newInstance,
	extend: typeof extend;
	evaluate: typeof evaluate;
	isPointIn3DEllipse: typeof isPointIn3DEllipse;
};
export default vtkSphere;
