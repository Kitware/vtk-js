import { vtkAlgorithm, vtkObject, vtkSubscription } from "../../../interfaces";


interface IJSONReaderOptions {
	binary?: boolean;
	compression?: string;
	progressCallback?: any;
}

/**
 * 
 */
export interface IJSONReaderInitialValues { }

type vtkJSONReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkJSONReader extends vtkJSONReaderBase {

	/**
	 * 
	 */
	getNumberOfOutputPorts(): number;

	/**
	 * Get the url of the object to load.
	 */
	getUrl(): string;

	/**
	 * 
	 * @param {Boolean} busy 
	 */
	invokeBusy(busy: boolean): void;

	/**
	 * 
	 */
	isBusy(): number;

	/**
	 * Load the object data.
	 * @param {IJSONReaderOptions} [options] 
	 */
	loadData(options?: IJSONReaderOptions): Promise<any>;

	/**
	 * 
	 * @param callback 
	 */
	onBusy(callback: (busy: boolean) => any): vtkSubscription;

	/**
	 * Parse data as text.
	 * @param {String} content The content to parse. 
	 */
	parseAsText(content: string): void;
	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the url of the object to load.
	 * @param {String} url the url of the object to load.
	 * @param {IJSONReaderOptions} [option] The JSON reader options.
	 */
	setUrl(url: string, option?: IJSONReaderOptions): Promise<string>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkJSONReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IJSONReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IJSONReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkJSONReader
 * @param {IJSONReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IJSONReaderInitialValues): vtkJSONReader;


/**
 * vtkJSONReader is a source object that reads JSON files.
 */
export declare const vtkJSONReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkJSONReader;
