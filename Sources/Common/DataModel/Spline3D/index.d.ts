import { vtkObject } from "../../../interfaces";
import { splineKind } from "./Constants";

export interface ISpline3DInitialValues {
	close?: boolean;
	intervals?: any;
	kind?: splineKind,
	tension?: number;
	continuity?: number;
	bias?: number;
}

export interface vtkSpline3D extends vtkObject {

	/**
	 * 
	 * @param points 
	 */
	computeCoefficients(points: number[]): void;
		
	/**
	 * 
	 * @param {Number} intervalIndex 
	 * @param {Number} t 
	 */
	getPoint(intervalIndex: number, t: number): number[];
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSpline3D characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISpline3DInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISpline3DInitialValues): void;

/**
 * Method used to create a new instance of vtkSpline3D.
 * @param {ISpline3DInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISpline3DInitialValues): vtkSpline3D;

/**
 * vtkSpline3D provides methods for creating a 1D cubic spline object from given
 * parameters, and allows for the calculation of the spline value and derivative
 * at any given point inside the spline intervals.
 */
export declare const vtkSpline3D: {
	newInstance: typeof newInstance;
	extend: typeof extend;
};
export default vtkSpline3D;
