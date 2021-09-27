import { vtkObject } from "../../../interfaces" ;
import { Vector3 } from "../../../types";

/**
 * 
 */
export interface IConeInitialValues {
	angle?: number;
}

export interface vtkCone extends vtkObject {

	/**
	 * Given the point x evaluate the cone equation.
	 * @param {Vector3} x The point coordinate.
	 */
	evaluateFunction(x: Vector3): number[];

	/**
	 * Given the point x evaluate the equation for the cone gradient.
	 * @param {Vector3} x The point coordinate.
	 */
	evaluateGradient(x: Vector3): number[];

	/**
	 * Get the angle of the cone.
	 */
	getAngle(): number;

	/**
	 * Set the value representing the angle of the cone.
	 * @param {Number} angle The angle of the cone. 
	 */
	setAngle(angle: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCone characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IConeInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IConeInitialValues): void;

/**
 * Method used to create a new instance of vtkCone.
 * @param {IConeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IConeInitialValues): vtkCone;

/** 
 * vtkCone computes the implicit function and/or gradient for a cone. vtkCone is
 * a concrete implementation of vtkImplicitFunction. TODO: Currently the cone's
 * axis of rotation is along the x-axis with the apex at the origin. To
 * transform this to a different location requires the application of a
 * transformation matrix. This can be performed by supporting transforms at the
 * implicit function level, and should be added.
 */
export declare const vtkCone: {
	newInstance: typeof newInstance, 
	extend: typeof extend;
};
export default vtkCone;
