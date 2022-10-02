import { vtkObject } from "../../../interfaces" ;


export interface ISpline1DInitialValues {}

// Boundary conditions available to compute open splines
// DEFAULT : desired slope at boundary point is derivative from two points (boundary and second interior)
// DERIVATIVE : desired slope at boundary point is the boundary value given.
// SECOND_DERIVATIVE : second derivative at boundary point is the boundary value given.
// SECOND_DERIVATIVE_INTERIOR_POINT : desired second derivative at boundary point is the boundary value given times second derivative
// at first interior point.
export enum BoundaryCondition {
	DEFAULT,
	DERIVATIVE,
	SECOND_DERIVATIVE,
	SECOND_DERIVATIVE_INTERIOR_POINT,
  }

export interface vtkSpline1D extends vtkObject {

	/**
	 * 
	 * @param {Number} size 
	 * @param {Float32Array} work 
	 * @param {Number[]} x 
	 * @param {Number[]} y 
	 */
	computeCloseCoefficients(size: number, work: Float32Array, x: number[], y: number[]): void;
		
	/**
	 * 
	 * @param {Number} size 
	 * @param {Float32Array} work 
	 * @param {Number[]} x 
	 * @param {Number[]} y
	 * @param {Object} options
	 * @param {BoundaryCondition} options.leftConstraint
	 * @param {Number} options.leftValue
	 * @param {BoundaryCondition} options.rightConstraint
	 * @param {Number} options.rightValue
	 */
	computeOpenCoefficients(size: number, work: Float32Array, x: number[], y: number[], options: { leftConstraint: BoundaryCondition, leftValue: number, rightConstraint: BoundaryCondition, rightValue: Number }): void;
		
	/**
	 * 
	 * @param {Number} intervalIndex 
	 * @param {Number} t 
	 */
	getValue(intervalIndex: number, t: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSpline1D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISpline1DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISpline1DInitialValues): void;

/**
 * Method used to create a new instance of vtkSpline1D.
 * @param {ISpline1DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISpline1DInitialValues): vtkSpline1D;

/**
 * vtkSpline1D provides methods for creating a 1D cubic spline object from given
 * parameters, and allows for the calculation of the spline value and derivative
 * at any given point inside the spline intervals.
 */
export declare const vtkSpline1D: {
	newInstance: typeof newInstance,
	extend: typeof extend
};
export default vtkSpline1D;
