import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 * 
 */
export interface IITKPolyDataReaderInitialValues {
	fileName?: string;
	arrayName?: string;
}

type vtkITKPolyDataReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkITKPolyDataReader extends vtkITKPolyDataReaderBase {

	/**
	 * Get the array name.
	 */
	getArrayName(): string;

	/**
	 * Get the filename.
	 */
	getFileName(): string;

	/**
	 * Parse data as array buffer.
	 * @param {ArrayBuffer} arrayBuffer The array buffer to parse. 
	 */
	parseAsArrayBuffer(arrayBuffer: ArrayBuffer): void;

	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the array name.
	 * @param {String} arrayName The name of the array.
	 */
	setArrayName(arrayName: string): boolean;

	/**
	 * Set the filename.
	 * @param {String} filename 
	 */
	setFileName(filename: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkITKPolyDataReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IITKPolyDataReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IITKPolyDataReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkITKPolyDataReader
 * @param {IITKPolyDataReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IITKPolyDataReaderInitialValues): vtkITKPolyDataReader;

/**
 * 
 * @param {*} fn 
 */
export function setReadPolyDataArrayBufferFromITK(fn : any): Promise<any>;
 
/**
 * The vtkITKPolyDataReader aims to read a ITK file format.
 */
export declare const vtkITKPolyDataReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	setReadPolyDataArrayBufferFromITK: typeof setReadPolyDataArrayBufferFromITK;
}
export default vtkITKPolyDataReader;
