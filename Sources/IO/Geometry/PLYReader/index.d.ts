import { VtkAlgorithm, VtkObject } from "vtk.js/Sources/macro";


interface IPLYReaderOptions {

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
interface IPLYReaderInitialValues {}

type vtkPLYReaderBase = VtkObject & Omit<VtkAlgorithm,
	'getInputData' |
	'setInputData' |
	'setInputConnection' |
	'getInputConnection' | 
	'addInputConnection' | 
	'addInputData' > ;

export interface vtkPLYReader extends vtkPLYReaderBase {

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
	loadData(options?: IPLYReaderOptions): Promise<any>;

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
	setUrl(url: string, option?: IPLYReaderOptions): boolean;

	/**
	 * 
	 * @param dataAccessHelper 
	 */
	setDataAccessHelper(dataAccessHelper: any): boolean;
	
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPLYReader characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPLYReaderInitialValues): void;

/**
 * Method used to create a new instance of vtkPLYReader
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(initialValues?: IPLYReaderInitialValues): vtkPLYReader;


/**
 * vtkPLYReader is a source object that reads polygonal data in Stanford
 * University PLY file format (see http://graphics.stanford.edu/data/3Dscanrep).
 * It requires that the elements "vertex" and "face" are defined. The "vertex"
 * element must have the properties "x", "y", and "z". The "face" element must
 * have the property "vertex_indices" defined. Optionally, if the "face" element
 * has the properties "intensity" and/or the triplet "red", "green", "blue", and
 * optionally "alpha"; these are read and added as scalars to the output data.
 * If the "face" element has the property "texcoord" a new TCoords point array
 * is created and points are duplicated if they have 2 or more different texture
 * coordinates.
 */
export declare const vtkPLYReader: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkPLYReader;
