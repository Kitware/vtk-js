import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 *
 */
export interface IConeSourceInitialValues {
	height?: number;
	radius?: number;
	resolution?: number;
	center?: number[] ;
	direction?: number[];
	capping?: boolean;
	pointType?: string;
}

type vtkConeSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkConeSource extends vtkConeSourceBase {

	/**
	 * Get the cap the base of the cone with a polygon.
	 * @default true
	 */
	getCapping(): boolean;

	/**
	 * Get the center of the cone.
	 * @default [0, 0, 0]
	 */
	getCenter(): number[];

	/**
	 * Get the center of the cone.
	 */
	getCenterByReference(): number[];

	/**
	 * Get the orientation vector of the cone.
	 * @default [1.0, 0.0, 0.0]
	 */
	getDirection(): number[];

	/**
	 * Get the orientation vector of the cone.
	 */
	getDirectionByReference(): number[];

	/**
	 * Get the height of the cone.
	 * @default 1.0
	 */
	getHeight(): number;

	/**
	 * Get the base radius of the cone.
	 * @default 0.5
	 */
	getRadius(): number;

	/**
	 * Get the number of facets used to represent the cone.
	 * @default 6
	 */
	getResolution(): number;

	/**
	 * Expose methods
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Turn on/off whether to cap the base of the cone with a polygon.
	 * @param {Boolean}  capping 
	 */
	setCapping(capping: boolean): boolean;

	/**
	 * Set the center of the cone.
	 * It is located at the middle of the axis of the cone.
	 * !!! warning
	 *     This is not the center of the base of the cone!
	 * @param {Number}  x 
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @default [0, 0, 0]
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the cone.
	 * It is located at the middle of the axis of the cone.
	 * !!! warning
	 *     This is not the center of the base of the cone!
	 * @param {Number[]} center 
	 * @default [0, 0, 0]
	 */
	setCenter(center: number[]): boolean;

	/**
	 * Set the center of the cone.
	 * It is located at the middle of the axis of the cone.
	 * !!! warning
	 *     This is not the center of the base of the cone!
	 * @param {Number[]} center 
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: number[]): boolean;

	/**
	 * Set the direction for the cone.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @default [1, 0, 0]
	 */
	setDirection(x: number, y: number, z: number): boolean;

	/**
	 * Set the direction for the cone.
	 * @param {Number[]} direction The direction coordinates.
	 */
	setDirection(direction: number[]): boolean;

	/**
	 * Set the direction for the cone.
	 * @param {Number[]} direction 
	 * @default [1, 0, 0]
	 */
	setDirection(direction: number[]): boolean;

	/**
	 * Set the direction for the cone.
	 * @param {Number[]} direction 
	 * @default [1, 0, 0]
	 */
	setDirectionFrom(direction: number[]): boolean;

	/**
	 * Set the height of the cone.
	 * This is the height along the cone in its specified direction.
	 * @param {Number} height 
	 */
	setHeight(height: number): boolean;

	/**
	 * Set the base radius of the cone.
	 * @param {Number} radius 
	 */
	setRadius(radius: number): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param resolution 
	 */
	setResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkConeSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IConeSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues ? : IConeSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkConeSource.
 * @param {IConeSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues ? : IConeSourceInitialValues): vtkConeSource;

/**
 * vtkConeSource creates a cone centered at a specified point and pointing in a specified direction.
 * (By default, the center is the origin and the direction is the x-axis.) Depending upon the resolution of this object,
 * different representations are created. If resolution=0 a line is created; if resolution=1, a single triangle is created;
 * if resolution=2, two crossed triangles are created. For resolution > 2, a 3D cone (with resolution number of sides)
 * is created. It also is possible to control whether the bottom of the cone is capped with a (resolution-sided) polygon,
 * and to specify the height and radius of the cone.
 * 
 * @example
 * ```js
 * import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
 * 
 * const cone = vtkConeSource.newInstance({ height: 2, radius: 1, resolution: 80 });
 * const polydata = cone.getOutputData();
 * ```
 */
export declare const vtkConeSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkConeSource;
