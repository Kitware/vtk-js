import { VtkAlgorithm, VtkObject } from "vtk.js/Sources/macro";

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

type vtkTextureMapToPlaneBase = VtkObject & VtkAlgorithm;

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
	 * @param automaticPlaneGeneration 
	 */
	setAutomaticPlaneGeneration(automaticPlaneGeneration: number): boolean;

	/**
	 * Set the normal object.
	 * @param {Number[]} normal The normal object coordinates.
	 */
	setNormal(normal: number[]): boolean;

	/**
	 * Set the normal object.
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	setNormal(x: number, y: number, z: number): boolean;

	/**
	 * 
	 * @param {Number[]} normal The normal object coordinates.
	 */
	setNormalFrom(normal: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param origin 
	 */
	setOrigin(origin: number[]): boolean;

	/**
	 * Set the origin of the plane.
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	setOrigin(x: number, y: number, z: number): boolean;

	/**
	 * Set the origin of the plane.
	 * @param origin 
	 */
	setOriginFrom(origin: number[]): boolean;

	/**
	 * Set the point which defines the first axis of the plane.
	 * @param point1 
	 */
	setPoint1(point1: number[]): boolean;

	/**
	 * Set the point which defines the first axis of the plane.
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	setPoint1(x: number, y: number, z: number): boolean;

	/**
	 * Set the point which defines the first axis of the plane.
	 * @param point1 
	 */
	setPoint1From(point1: number[]): boolean;

	/**
	 * Set the point which defines the second axis of the plane
	 * @param point2 
	 */
	setPoint2(point2: number[]): boolean;

	/**
	 * Set the point which defines the second axis of the plane
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	setPoint2(x: number, y: number, z: number): boolean;

	/**
	 * Set the point which defines the second axis of the plane
	 * @param point2 
	 */
	setPoint2From(point2: number[]): boolean;

	/**
	 * Set the s-coordinate range for texture s-t coordinate pair.
	 * @param sRange 
	 */
	setSRange(sRange: number[]): boolean;

	/**
	 * Set the s-coordinate range for texture s-t coordinate pair.
	 * @param min 
	 * @param max 
	 */
	setSRange(min: number, max: number): boolean;

	/**
	 * Set the s-coordinate range for texture s-t coordinate pair.
	 * @param sRange 
	 */
	setSRangeFrom(sRange: number[]): boolean;

	/**
	 * Set the t-coordinate range for texture s-t coordinate pair.
	 * @param tRange 
	 */
	setTRange(tRange: number[]): boolean;

	/**
	 * Set the t-coordinate range for texture s-t coordinate pair.
	 * @param min 
	 * @param max 
	 */
	setTRange(min: number, max: number): boolean;

	/**
	 * Set the t-coordinate range for texture s-t coordinate pair.
	 * @param tRange 
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
