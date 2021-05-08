import { vtkObject } from "vtk.js/Sources/interfaces" ;


interface ISphereInitialValues {
	radius?: number;
	center?: number[];
}

export interface vtkSphere extends vtkObject {

	/**
	 * Given the point xyz (three floating value) evaluate the sphere
	 * equation.
	 * @param {Number} xyz The point coordinate.
	 */
	evaluateFunction(xyz: number[]): number[];

	/**
	 * Given the point xyz (three floating values) evaluate the equation for the
	 * sphere gradient.
	 * @param {Number[]} xyz The point coordinate.
	 */
	evaluateGradient(xyz: number[]): number[];

	/**
	 * Get the center of the sphere.
	 */
	getCenter(): number[];

	/**
	 * Get the center of the sphere.
	 */
	getCenterByReference(): number[];

	/**
	 * Get the radius of the sphere.
	 */
	getRadius(): number;

	/**
	 * Set the center of the sphere.
	 * @param {Number[]} center The center coordinate.
	 */
	setCenter(center: number[]): boolean;

	/**
	 * Set the center of the sphere.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the sphere.
	 * @param {Number[]} center The center coordinate.
	 */
	setCenterFrom(center: number[]): boolean;

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

/*
* @param radius 
* @param center 
* @param x 
*/
declare function evaluate(radius: number, center: number[], x: number[]): number;

/**
* 
* @param point 
* @param bounds 
*/
declare function isPointIn3DEllipse(point: any, bounds: any): boolean;

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
