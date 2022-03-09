import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import HtmlDataAccessHelper from "../../Core/DataAccessHelper/HtmlDataAccessHelper";
import HttpDataAccessHelper from "../../Core/DataAccessHelper/HttpDataAccessHelper";
import JSZipDataAccessHelper from "../../Core/DataAccessHelper/JSZipDataAccessHelper";
import LiteHttpDataAccessHelper from "../../Core/DataAccessHelper/LiteHttpDataAccessHelper";


interface IXMLReaderOptions {
	binary?: boolean;
	compression?: string;
	progressCallback?: any;
}

interface IRet {
	name: string;
	numberOfComponents: number;
	values: any;
}

/**
 * 
 */
export interface IXMLReaderInitialValues { }

type vtkXMLReaderBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkXMLReader extends vtkXMLReaderBase {

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
	 * @param {IXMLReaderOptions} [options] 
	 */
	loadData(options?: IXMLReaderOptions): Promise<any>;

	/**
	 * Parse data.
	 * @param {String | ArrayBuffer} content The content to parse.
	 */
	parse(content: string | ArrayBuffer): void;

	/**
	 * Parse data as ArrayBuffer.
	 * @param {ArrayBuffer} content The content to parse. 
	 */
	parseAsArrayBuffer(content: ArrayBuffer): void;

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
	 * 
	 * @param dataAccessHelper 
	 */
	setDataAccessHelper(dataAccessHelper: HtmlDataAccessHelper | HttpDataAccessHelper | JSZipDataAccessHelper | LiteHttpDataAccessHelper): boolean;

	/**
	 * Set the url of the object to load.
	 * @param {String} url the url of the object to load.
	 * @param {IXMLReaderOptions} [option] The XML reader options.
	 */
	setUrl(url: string, option?: IXMLReaderOptions): Promise<any>;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkXMLReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IXMLReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IXMLReaderInitialValues): void;

/**
 * @param {Number} size 
 * @param {HTMLElement} dataArrayElem 
 * @param {String} compressor 
 * @param {String} byteOrder 
 * @param {String} headerType 
 * @param {ArrayBuffer} binaryBuffer 
 */
export function processDataArray(size: number, dataArrayElem: HTMLElement, compressor: string, byteOrder: string, headerType: string, binaryBuffer: ArrayBuffer): IRet;

/**
 * @param {Number} size 
 * @param {HTMLElement} containerElem 
 * @param {String} compressor 
 * @param {String} byteOrder 
 * @param {String} headerType 
 * @param {ArrayBuffer} binaryBuffer 
 */
export function processCells(size: number, containerElem: HTMLElement, compressor: string, byteOrder: string, headerType: string, binaryBuffer: ArrayBuffer): Uint32Array;

/**
 * @param {Number} size 
 * @param {HTMLElement} fieldElem 
 * @param {HTMLElement} fieldContainer 
 * @param {String} compressor 
 * @param {String} byteOrder 
 * @param {String} headerType 
 * @param {ArrayBuffer} binaryBuffer 
 */
export function processFieldData(size: number, fieldElem: HTMLElement, fieldContainer: HTMLElement, compressor: string, byteOrder: string, headerType: string, binaryBuffer: ArrayBuffer): void;


/**
 * vtkXMLReader is a source object that parses a VTK XML input file. 
 */
export declare const vtkXMLReader: {
	extend: typeof extend;
	processDataArray: typeof processDataArray;
	processCells: typeof processCells;
	processFieldData: typeof processFieldData;
}
export default vtkXMLReader;
