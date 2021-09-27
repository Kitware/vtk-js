import { vtkAlgorithm, vtkObject } from "../../../interfaces";

export enum DesiredOutputPrecision {
	/**
	 * Output precision should match the input precision
	 */
	DEFAULT,

	/**
	 * Output single-precision floating-point (i.e. float32)
	 */
	SINGLE,

	/**
	 * Output double-precision floating point (i.e. float64)
	 */
	DOUBLE
}

/**
 *
 */
export interface IAppendPolyDataInitialValues {
	outputPointsPrecision?: DesiredOutputPrecision;
}

type vtkAppendPolyDataBase = vtkObject & vtkAlgorithm;

export interface vtkAppendPolyData extends vtkAppendPolyDataBase {

	/**
	 * Get the desired precision for the output types.
	 */
	getOutputPointsPrecision(): DesiredOutputPrecision;

	/**
	 * Set the desired precision for the output types.
	 * @param outputPointsPrecision
	 */
	setOutputPointsPrecision(outputPointsPrecision: DesiredOutputPrecision): boolean;

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAppendPolyData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAppendPolyDataInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IAppendPolyDataInitialValues): void;

/**
 * Method used to create a new instance of vtkAppendPolyData
 * @param {IAppendPolyDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IAppendPolyDataInitialValues): vtkAppendPolyData;


/**
 * vtkAppendPolyData - append one or more polygonal datasets together
 *
 * vtkAppendPolyData is a filter that appends one of more polygonal datasets into a
 * single polygonal dataset. All geometry is extracted and appended, but point and
 * cell attributes (i.e., scalars, vectors, normals) are extracted and appended
 * only if all datasets have the point and/or cell attributes available.  (For
 * example, if one dataset has point scalars but another does not, point scalars
 * will not be appended.)
 * 
 * @example
 * Provide the first input to the filter via the standard
 * `setInput(Data/Connection)` methods. Any additional inputs can be provided via
 * the `addInput(Data/Connection)` methods. When only a single input is provided,
 * it is passed through as is to the output.
 * 
 * ```js
 * const cone = vtkConeSource.newInstance();
 * const cylinder = vtkCylinderSource.newInstance();
 *
 * const appendPolyData = vtkAppendPolyData.newInstance();
 * appendPolyData.setInputConnection(cone.getOutputPort());
 * appendPolyData.addInputConnection(cylinder.getOutputPort());
 *
 * const appendedData = appendPolyData.getOutputData();
 * ```
 */
export declare const vtkAppendPolyData: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkAppendPolyData;
