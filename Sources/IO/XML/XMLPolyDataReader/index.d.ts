import vtkXMLReader, { IXMLReaderInitialValues } from "../XMLReader";

/**
 * 
 */
export interface IXMLPolyDataReaderInitialValues extends IXMLReaderInitialValues{ 
	dataType?: string;
}

export interface vtkXMLPolyDataReader extends vtkXMLReader {

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
 * Method used to decorate a given object (publicAPI+model) with vtkXMLPolyDataReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IXMLPolyDataReaderInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IXMLPolyDataReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkPLYReader
 * @param {IXMLPolyDataReaderInitialValues} [initialValues] for pre-setting some of its content
 */
 export function newInstance(initialValues?: IXMLPolyDataReaderInitialValues): vtkXMLPolyDataReader;

/**
 * vtkXMLPolyDataReader is a source object that parses a VTK XML input file. 
 */
export declare const vtkXMLPolyDataReader: {
	extend: typeof extend;
	newInstance: typeof newInstance;
}
export default vtkXMLPolyDataReader;
