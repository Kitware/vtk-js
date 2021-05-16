import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 *
 */
interface ITextureMapToPlane {
	origin?: number[];
	point1?: number[];
	point2?: number[];
	normal?: number[];
	sRange?: number[];
	tRange?: number[];
	automaticPlaneGeneration?: number;
}

type vtkTextureMapToPlaneBase = vtkObject & vtkAlgorithm;

export interface vtkTextureMapToPlane extends vtkTextureMapToPlaneBase {

	/**
	 * Get whether the automatic plane generation is set.
	 */
	getAutomaticPlaneGeneration(): number;

	/**
	 * Get the normal object.
	 */
	getNormal(): number[];

	/**
	 * Get the normal object.
	 */
	getNormalByReference(): number[];

	/**
	 * Get the origin of the plane.
	 */
	getOrigin(): number[];

	/**
	 * Get the origin of the plane.
	 */
	getOriginByReference(): number[];

	/**
	 * Get the point which defines the first axis of the plane.
	 */
	getPoint1(): number[];

	/**
	 * Get the point which defines the first axis of the plane.
	 */
	getPoint1ByReference(): number[];

	/**
	 * Get the point which defines the second axis of the plane
	 */
	getPoint2(): number[];

	/**
	 * Get the point which defines the second axis of the plane
	 */
	getPoint2ByReference(): number[];

	/**
	 * Get the s-coordinate range for texture s-t coordinate pair.
	 */
	getSRange(): number[];

	/**
	 * Get the s-coordinate range for texture s-t coordinate pair.
	 */
	getSRangeByReference(): number[];

	/**
	 * Get the t-coordinate range for texture s-t coordinate pair.
	 */
	getTRange(): number[];

	/**
	 * Get the t-coordinate range for texture s-t coordinate pair.
	 */
	getTRangeByReference(): number[];

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Turn on/off the automatic plane generation.
	 * @param {Number} automaticPlaneGeneration 
	 */
	setAutomaticPlaneGeneration(automaticPlaneGeneration: number): boolean;

	/**
	 * Set the normal object.
	 * @param {Number[]} normal The normal object coordinates.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal object.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * Set the normal object.
	 * @param {Number[]} normal The normal object coordinates.
	 */
	setNormalFrom(normal: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number[]} origin The origin of the plane.
	 */
	setOrigin(origin: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the plane.
	 * @param {Number[]} origin The origin of the plane.
	 */
	setOriginFrom(origin: number[]): boolean;

	/**
	 * Set the point which defines the first axis of the plane.
	 * @param {Number[]} point1 The coordinate of the point.
	 */
	setPoint1(point1: number[]): boolean;

	/**
	 * Set the point which defines the first axis of the plane.
	 * @param {Number} x The x coordinate of the point.
	 * @param {Number} y The y coordinate of the point.
	 * @param {Number} z The z coordinate of the point.
	 */
	setPoint1(x: number, y: number, z: number): boolean;

	/**
	 * Set the point which defines the first axis of the plane.
	 * @param {Number[]} point1 The coordinate of the point.
	 */
	setPoint1From(point1: number[]): boolean;

	/**
	 * Set the point which defines the second axis of the plane
	 * @param {Number[]} point2 The coordinate of the point.
	 */
	setPoint2(point2: number[]): boolean;

	/**
	 * Set the point which defines the second axis of the plane
	 * @param {Number} x The x coordinate of the point.
	 * @param {Number} y The y coordinate of the point.
	 * @param {Number} z The z coordinate of the point.
	 */
	setPoint2(x: number, y: number, z: number): boolean;

	/**
	 * Set the point which defines the second axis of the plane
	 * @param {Number[]} point2 The coordinate of the point.
	 */
	setPoint2From(point2: number[]): boolean;

	/**
	 * Set the s-coordinate range for texture s-t coordinate pair.
	 * @param {Number[]} sRange The s-coordinate range.
	 */
	setSRange(sRange: number[]): boolean;

	/**
	 * Set the s-coordinate range for texture s-t coordinate pair.
	 * @param {Number} min The min of the s-coordinate range
	 * @param {Number} max The min of the s-coordinate range.
	 */
	setSRange(min: number, max: number): boolean;

	/**
	 * Set the s-coordinate range for texture s-t coordinate pair.
	 * @param {Number[]} sRange The s-coordinate range.
	 */
	setSRangeFrom(sRange: number[]): boolean;

	/**
	 * Set the t-coordinate range for texture s-t coordinate pair.
	 * @param {Number[]} tRange The t-coordinate range.
	 */
	setTRange(tRange: number[]): boolean;

	/**
	 * Set the t-coordinate range for texture s-t coordinate pair.
	 * @param {Number} min The min of the t-coordinate range
	 * @param {Number} max The min of the t-coordinate range.
	 */
	setTRange(min: number, max: number): boolean;

	/**
	 * Set the t-coordinate range for texture s-t coordinate pair.
	 * @param {Number[]} tRange The t-coordinate range.
	 */
	setTRangeFrom(tRange: number[]): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTextureMapToPlane characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextureMapToPlane} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITextureMapToPlane): void;

/**
 * Method used to create a new instance of vtkTextureMapToPlane
 * @param {ITextureMapToPlane} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITextureMapToPlane): vtkTextureMapToPlane;

/**
 * vtkTextureMapToPlane generate texture coordinates by mapping points to a
 * plane The TCoords DataArray is name 'Texture Coordinates'
 */
export declare const vtkTextureMapToPlane: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkTextureMapToPlane;
