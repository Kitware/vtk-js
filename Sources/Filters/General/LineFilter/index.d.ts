import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 *
 */
export interface ILineFilterInitialValues {
}

type vtkLineFilterBase = vtkObject & vtkAlgorithm;

export interface vtkLineFilter extends vtkLineFilterBase {

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLineFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILineFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkLineFilter
 * @param {ILineFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILineFilterInitialValues): vtkLineFilter;


/**
 * vtkLineFilter - filters lines in polydata
 *
 * vtkLineFilter is a filter that only let's through lines of a vtkPolydata.
 */
export declare const vtkLineFilter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkLineFilter;
