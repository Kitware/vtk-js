import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import HtmlDataAccessHelper from "../../Core/DataAccessHelper/HtmlDataAccessHelper";
import HttpDataAccessHelper from "../../Core/DataAccessHelper/HttpDataAccessHelper";
import JSZipDataAccessHelper from "../../Core/DataAccessHelper/JSZipDataAccessHelper";
import LiteHttpDataAccessHelper from "../../Core/DataAccessHelper/LiteHttpDataAccessHelper";

interface IJSONNucleoReaderOptions {
	binary?: boolean;
	compression?: string;
	progressCallback?: any;
}

/**
 * 
 */
export interface IJSONNucleoReaderInitialValues {}

type vtkJSONNucleoReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkJSONNucleoReader extends vtkJSONNucleoReaderBase {

	/**
	 * 
	 */
	getBaseURL(): string;

	/**
	 * 
	 */
	getDataAccessHelper(): HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper;

	/**
	 * Get the url of the object to load.
	 */
	getUrl(): string;

	/**
	 * Load the object data.
	 * @param {IJSONNucleoReaderOptions} [options] 
	 */
	loadData(options?: IJSONNucleoReaderOptions): Promise<any>;

	/**
	 * Parse data as text.
	 * @param {String} jsonAsTxt The content to parse. 
	 */
	parseAsText(jsonAsTxt: string): void;
	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * 
	 * @param dataAccessHelper 
	 */
	setDataAccessHelper(dataAccessHelper: HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper): boolean;

	/**
	 * Set the url of the object to load.
	 * @param {String} url the url of the object to load.
	 * @param {IJSONNucleoReaderOptions} [option] The JSONNucleo reader options.
	 */
	setUrl(url: string, option: IJSONNucleoReaderOptions): Promise<string>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkJSONNucleoReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IJSONNucleoReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IJSONNucleoReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkJSONNucleoReader
 * @param {IJSONNucleoReaderInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IJSONNucleoReaderInitialValues): vtkJSONNucleoReader;


/**
 * vtkJSONNucleoReader reader.
 */
export declare const vtkJSONNucleoReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkJSONNucleoReader;
