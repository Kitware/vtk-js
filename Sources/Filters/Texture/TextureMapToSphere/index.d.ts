import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 *
 */
interface ITextureMapToSphere {
	center?: number[];
	automaticSphereGeneration?: number;
	preventSeam?: number;
}

type vtkTextureMapToSphereBase = vtkObject & vtkAlgorithm;

export interface vtkTextureMapToSphere extends vtkTextureMapToSphereBase {

	/**
	 * Get whether the automatic sphere generation is set.
	 */
	getAutomaticSphereGeneration(): number;

	/**
	 * Get the point defining the center of the sphere.
	 */
	getCenter(): number[];

	/**
	 * Get the normal object.
	 */
	getCenterByReference(): number[];

	/**
	 * Get whether the prevent seam is set.
	 */
	getPreventSeam(): number;

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Turn on/off the automatic sphere generation.
	 * @param automaticSphereGeneration 
	 */
	setAutomaticSphereGeneration(automaticSphereGeneration: number): boolean;

	/**
	 * Control how the texture coordinates are generated.
	 * 
	 * If PreventSeam is set, the s-coordinate ranges :
	 * 
	 * - from 0->1 and 1->0 corresponding to the theta angle variation between 0->180 and 180->0 degrees
	 * - Otherwise, the s-coordinate ranges from 0->1 between 0->360 degrees.
	 * @param preventSeam 
	 */
	setPreventSeam(preventSeam: number): boolean;

	/**
	 * Set the point defining the center of the sphere.
	 * @param {Number[]} center The center point coordinates.
	 */
	setCenter(center: number[]): boolean;

	/**
	 * Set the point defining the center of the sphere.
	 * @param x 
	 * @param y 
	 * @param z 
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the point defining the center of the sphere.
	 * @param {Number[]} center The center point coordinates.
	 */
	setCenterFrom(center: number[]): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTextureMapToSphere characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITextureMapToSphere} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ITextureMapToSphere): void;

/**
 * Method used to create a new instance of vtkTextureMapToSphere
 * @param {ITextureMapToSphere} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ITextureMapToSphere): vtkTextureMapToSphere;

/**
 * vtkTextureMapToSphere generate texture coordinates by mapping points to
 * sphere The TCoords DataArray is name 'Texture Coordinate'
 */
export declare const vtkTextureMapToSphere: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkTextureMapToSphere;
