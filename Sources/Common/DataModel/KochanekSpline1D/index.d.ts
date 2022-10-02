import vtkSpline1D, { ISpline1DInitialValues, BoundaryCondition } from '../Spline1D';

export interface IKochanekSpline1DInitialValues extends ISpline1DInitialValues {
	tension?: number;
	bias?: number;
	continuity?: number;
}

export interface vtkKochanekSpline1D extends vtkSpline1D {

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
	getValue(intervalIndex: number, t: number): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkKochanekSpline1D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IKochanekSpline1DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IKochanekSpline1DInitialValues): void;

/**
 * Method used to create a new instance of vtkKochanekSpline1D.
 * @param {IKochanekSpline1DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IKochanekSpline1DInitialValues): vtkKochanekSpline1D;

/**
 * vtkKochanekSpline1D provides methods for creating a Kochanek interpolating
 * spline object from given parameters, and allows for the calculation of the
 * spline value and derivative at any given point inside the spline intervals.
 */

export declare const vtkKochanekSpline1D: {
	newInstance: typeof newInstance,
	extend: typeof extend
};
export default vtkKochanekSpline1D;
