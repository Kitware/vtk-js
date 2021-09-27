import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 *
 */
export interface ITriangleFilterInitialValues {
	errorCount?: number;
}

type vtkTriangleFilterBase = vtkObject & vtkAlgorithm;

export interface vtkTriangleFilter extends vtkTriangleFilterBase {

	/**
	 * Get the desired precision for the output types.
	 */
	getErrorCount(): number;

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTriangleFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITriangleFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITriangleFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkTriangleFilter
 * @param {ITriangleFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITriangleFilterInitialValues): vtkTriangleFilter;


/**
 * vtkTriangleFilter - A filter that generates triangles for larger cells
 *
 * vtkTriangleFilter is a filter that converts cells wih more than 3 points into
 * triangles.
 */
export declare const vtkTriangleFilter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkTriangleFilter;
