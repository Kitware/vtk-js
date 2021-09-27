import { vtkObject } from "../../../interfaces" ;
import { Vector3 } from "../../../types";

/**
 * 
 */
export interface ICylinderInitialValues {
	radius?: number;
	center?: number[];
	axis?: number[];
}

export interface vtkCylinder extends vtkObject {

	/**
	 * Given the point xyz (three floating value) evaluate the cylinder
	 * equation.
	 * @param {Vector3} xyz The point coordinate.
	 */
	evaluateFunction(xyz: Vector3): number[];

	/**
	 * Given the point xyz (three floating values) evaluate the equation for the
	 * cylinder gradient.
	 * @param {Vector3} xyz The point coordinate.
	 */
	evaluateGradient(xyz: Vector3): number[];

	/**
	 * Get the angle of the cone.
	 */
	getAngle(): number;

	/**
	 * Get the axis of the cylinder.
	 */
	getAxis(): number[];

	/**
	 * Get the axis of the cylinder.
	 */
	getAxisByReference(): number[];

	/**
	 * Get the center of the cylinder.
	 */
	getCenter(): number[];

	/**
	 * Get the center of the cylinder.
	 */
	getCenterByReference(): number[];

	/**
	 * Get the radius of the cylinder.
	 */
	getRadius(): number;

	/**
	 * Set the value representing the angle of the cone.
	 * @param {Number} angle The angle of the cone. 
	 */
	setAngle(angle: number): boolean;

	/**
	 * Set the axis of the cylinder.
	 * @param {Number[]} axis The axis coordinate.
	 */
	setAxis(axis: number[]): boolean;

	/**
	 * Set the axis of the cylinder.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setAxis(x: number, y: number, z: number): boolean;

	/**
	 * Set the axis of the cylinder.
	 * @param {Number[]} axis The axis coordinate.
	 */
	setAxisFrom(axis: number[]): boolean;

	/**
	 * Set the center of the cylinder.
	 * @param {Number[]} center The center coordinate.
	 */
	setCenter(center: number[]): boolean;

	/**
	 * Set the center of the cylinder.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the cylinder.
	 * @param {Number[]} center The center coordinate.
	 */
	setCenterFrom(center: number[]): boolean;

	/**
	 * Set the radius of the cylinder.
	 * @param {Number} radius The radius of the cylinder.
	 */
	setRadius(radius: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCylinder characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICylinderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICylinderInitialValues): void;

/**
 * Method used to create a new instance of vtkCylinder.
 * @param {ICylinderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICylinderInitialValues): vtkCylinder;

/**
 * Evaluate of the cylinder equation without setting the data members center and
 * radius.
 * @param {Number} radius 
 * @param {Number} center 
 * @param {Number[]} axis 
 * @param {Number[]} x 
 */
export function evaluate(radius: number, center: number[], axis: number[], x: number[]): number;

/** 
 * vtkCylinder computes the implicit function and/or gradient for a cylinder.
 * vtkCylinder is a concrete implementation of vtkImplicitFunction.
 */
export declare const vtkCylinder: {
	newInstance: typeof newInstance,
	extend: typeof extend;
	evaluate: typeof evaluate;
};
export default vtkCylinder;
