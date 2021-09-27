import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 * 
 */
export interface IITKImageReaderInitialValues {
	fileName?: string;
	arrayName?: string;
}

type vtkITKImageReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkITKImageReader extends vtkITKImageReaderBase {

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
 * Method used to decorate a given object (publicAPI+model) with vtkITKImageReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IITKImageReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IITKImageReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkITKImageReader
 * @param {IITKImageReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IITKImageReaderInitialValues): vtkITKImageReader;

/**
 * 
 * @param {*} fn 
 */
export function setReadImageArrayBufferFromITK(fn : any): Promise<any>;
 
/**
 * The vtkITKImageReader aims to read a ITK file format.
 */
export declare const vtkITKImageReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	setReadImageArrayBufferFromITK: typeof setReadImageArrayBufferFromITK;
}
export default vtkITKImageReader;
