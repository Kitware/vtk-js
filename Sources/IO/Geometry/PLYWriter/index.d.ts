import { mat4 } from "gl-matrix";
import vtkPolyData from "../../../Common/DataModel/PolyData";
import { vtkAlgorithm, vtkObject } from "../../../interfaces";

export enum FormatTypes {
	ASCII,
	BINARY
}

export enum TextureCoordinatesName {
	UV,
	TEXTURE_UV
}

/**
 * 
 */
export interface IPLYWriterInitialValues {
	format?: FormatTypes,
	dataByteOrder?: number,
	comments?: string[],
	textureFileName?: string,
	textureCoordinatesName?: TextureCoordinatesName,
	transform?: mat4,
	withNormals?: boolean,
	withUVs?: boolean,
	withColors?: boolean,
	withIndice?: boolean
}

type vtkPLYWriterBase = vtkObject & vtkAlgorithm;

export interface vtkPLYWriter extends vtkPLYWriterBase {

	/**
	 * Get byte order value.
	 */
	getDataByteOrder(): number;

	/**
	 * Get file format value.
	 */
	getFormat(): FormatTypes;

	/**
	 * Get header comments.
	 */
	getHeaderComments(): string[];

	/**
	 * Get textures mapping coordinates format.
	 */
	getTextureCoordinatesName(): TextureCoordinatesName;

	/**
	 * Get texture filename.
	 */
	getTextureFileName(): string;

	/**
	 * Get transformation matrix.
	 */
	getTransform(): mat4;

	/**
	 * Get whether colors values are included.
	 */
	getWithColors(): boolean;

	/**
	 * Get whether indices are included.
	 */
	getWithIndices(): boolean;

	/**
	 * Get whether normals are included.
	 */
	getWithNormals(): boolean;

	/**
	 * Get textures mapping coordinates.
	 */
	getWithUVs(): boolean;

	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set byte order.
	 * @param {Number} byteOrder Byte order.
	 */
	setDataByteOrder(byteOrder: number): boolean;

	/**
	 * Set file format.
	 * @param {FormatTypes} format File format.
	 */
	setFormat(format: FormatTypes): boolean;

	/**
	 * Set header comments.
	 * @param {String[]} headerComments Header comments.
	 */
	setHeaderComments(headerComments: string[]): boolean;

	/**
	 * Set textures coordinates format.
	 * @param {TextureCoordinatesName} textureCoordinatesName Textures mapping coordinates format.
	 */
	setTextureCoordinatesName(textureCoordinatesName: TextureCoordinatesName): boolean;

	/**
	 * Set texture filename.
	 * @param {String} textureFileName Texture filename.
	 */
	setTextureFileName(textureFileName: string): boolean;

	/**
	 * Set tranformation matrix.
	 * @param {mat4} transform Tranformation matrix.
	 */
	setTransform(transform: mat4): boolean;

	/**
	 * Set colors values.
	 * @param {Boolean} withColors Include colors.
	 */
	setWithColors(withColors: boolean): boolean;

	/**
	 * Set indices values.
	 * @param {Boolean} withIndices Include indices.
	 */
	setWithIndices(withIndices: boolean): boolean;

	/**
	 * Set normals values.
	 * @param {Boolean} withNormals Include normals.
	 */
	setWithNormals(withNormals: boolean): boolean;

	/**
	 * Set UVs values.
	 * @param {Boolean} withUVs Include textures mapping coordinates.
	 */
	setWithUVs(withUVs: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPLYWriter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPLYWriterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPLYWriterInitialValues): void;

/**
 * Method used to create a new instance of vtkPLYWriter
 * @param {IPLYWriterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPLYWriterInitialValues): vtkPLYWriter;


/**
 * 
 * @param {vktPolyData} polyData 
 * @param {FormatTypes} [format] 
 * @param {Number} [dataByteOrder] 
 * @param {String[]} [comments] Header comments.
 * @param {String} [textureFileName] Texture file n coordinates name.
 * @param {TextureCoordinatesName} [textureCoordinatesName] Textures mapping coordinates format.
 * @param {mat4} [transform] Tranformation matrix.
 * @param {Boolean} [withNormals] Include normals.
 * @param {Boolean} [withUVs] Include textures mapping coordinates.
 * @param {Boolean} [withColors] Include colors.
 * @param {Boolean} [withIndice] Include indice.
 */
export function writePLY(polyData: vtkPolyData, format?: FormatTypes, 
	dataByteOrder?: number, comments?: string[], textureFileName?: string, 
	textureCoordinatesName?: TextureCoordinatesName, transform?: mat4, withNormals?: boolean, 
	withUVs?: boolean, withColors?: boolean, withIndice?: boolean): vtkPolyData;

/**
 * vtkPLYWriter writes polygonal data in Stanford University PLY format (see
 * http://graphics.stanford.edu/data/3Dscanrep/). The data can be written in
 * either binary (little or big endian) or ASCII representation. As for
 * PointData and CellData, vtkPLYWriter cannot handle normals or vectors. It
 * only handles RGB PointData and CellData. You need to set the name of the
 * array (using SetName for the array and SetArrayName for the writer). If the
 * array is not a vtkUnsignedCharArray with 3 or 4 components, you need to
 * specify a vtkLookupTable to map the scalars to RGB.
 */
export declare const vtkPLYWriter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	writePLY: typeof writePLY;
}
export default vtkPLYWriter;
