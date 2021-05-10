import { mat4 } from "gl-matrix";
import vtkPolyData from "vtk.js/Sources/Common/DataModel/PolyData";
import { vtkAlgorithm, vtkObject } from "vtk.js/Sources/interfaces";

export enum FormatTypes {
	ASCII,
	BINARY
}

/**
 * 
 */
interface ISTLWriterInitialValues { }

type vtkSTLWriterBase = vtkObject & vtkAlgorithm;

export interface vtkSTLWriter extends vtkSTLWriterBase {

	/**
	 * 
	 */
	getFormat(): FormatTypes;

	/**
	 * 
	 */
	getTransform(): mat4;

	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * 
	 * @param format 
	 */
	setFormat(format: FormatTypes): boolean;

	/**
	 * 
	 * @param format 
	 */
	setTransform(transform: mat4): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSTLWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISTLWriterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISTLWriterInitialValues): void;

/**
 * Method used to create a new instance of vtkSTLWriter
 * @param {ISTLWriterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISTLWriterInitialValues): vtkSTLWriter;

/**
 * 
 */
export function writeSTL(polyData: vtkPolyData, format?: FormatTypes, transform?: mat4): any;


/**
 * vtkSTLWriter writes stereo lithography (.stl) files in either ASCII or binary
 * form. Stereo lithography files contain only triangles. Since VTK 8.1, this
 * writer converts non-triangle polygons into triangles, so there is no longer a
 * need to use vtkTriangleFilter prior to using this writer if the input
 * contains polygons with more than three vertices.
 */
export declare const vtkSTLWriter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	writeSTL: typeof writeSTL;
}
export default vtkSTLWriter;
