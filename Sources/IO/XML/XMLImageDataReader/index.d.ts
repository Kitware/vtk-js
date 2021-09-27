import vtkXMLReader, { IXMLReaderInitialValues } from "../XMLReader";

/**
 * 
 */
export interface IXMLImageDataReaderInitialValues extends IXMLReaderInitialValues { 
	dataType?: string;
}

export interface vtkXMLImageDataReader extends vtkXMLReader {

	/**
	 * Parse data as XML.
	 * @param rootElem 
	 * @param type 
 	 * @param {String} compressor 
 	 * @param {String} byteOrder 
 	 * @param {String} headerType 
	 */
	parseXML(rootElem: any, type: any, compressor: string, byteOrder: string, headerType: string): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkXMLImageDataReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IXMLImageDataReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IXMLImageDataReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkPLYReader
 * @param {IXMLImageDataReaderInitialValues} [initialValues] for pre-setting some of its content
 */
 export function newInstance(initialValues?: IXMLImageDataReaderInitialValues): vtkXMLImageDataReader;

/**
 * vtkXMLImageDataReader is a source object that parses a VTK XML input file. 
 */
export declare const vtkXMLImageDataReader: {
	extend: typeof extend;
	newInstance: typeof newInstance;
}
export default vtkXMLImageDataReader;
