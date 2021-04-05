import { VtkAlgorithm, VtkObject } from "vtk.js/Sources/macro";


interface ISTLReaderOptions {

	/**
	 * 
	 */
	binary?: boolean;

	/**
	 * 
	 */
	compression?: string;

	/**
	 * 
	 */
	progressCallback?: any;
}

/**
 * 
 */
interface ISTLReaderInitialValues {}

type vtkSTLReaderBase = VtkObject & Omit<VtkAlgorithm,
	'getInputData' |
	'setInputData' |
	'setInputConnection' |
	'getInputConnection' | 
	'addInputConnection' | 
	'addInputData' > ;

export interface vtkSTLReader extends vtkSTLReaderBase {

	/**
	 * 
	 */
	getBaseURL(): string;

	/**
	 * 
	 */
	getDataAccessHelper(): any;

	/**
	 * 
	 */
	getUrl(): string;

	/**
	 * 
	 * @param options 
	 */
	loadData(options?: ISTLReaderOptions): Promise<any>;

	/**
	 * 
	 * @param content 
	 */
	parse(content: string | ArrayBuffer): void;

	/**
	 * 
	 * @param content 
	 */
	parseAsArrayBuffer(content: ArrayBuffer): void;

	/**
	 * 
	 * @param content 
	 */
	parseAsText(content: string): void;
	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * 
	 * @param url 
	 * @param option 
	 */
	setUrl(url: string, option?: ISTLReaderOptions): boolean;

	/**
	 * 
	 * @param dataAccessHelper 
	 */
	setDataAccessHelper(dataAccessHelper: any): boolean;
	
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSTLReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISTLReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkSTLReader
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: ISTLReaderInitialValues): vtkSTLReader;


/**
 * vtkSTLReader is a source object that reads ASCII or binary stereo lithography
 * files (.stl files). The object automatically detects whether the file is
 * ASCII or binary. .stl files are quite inefficient since they duplicate vertex
 * definitions.
 */
export declare const vtkSTLReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkSTLReader;
