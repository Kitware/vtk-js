import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector3 } from "../../../types";

/**
 *
 */
export interface ICircleSourceInitialValues {
	radius?: number;
	resolution?: number;
	center?: Vector3;
	pointType?: string;
	lines?: boolean;
	face?: boolean;
}

type vtkCircleSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkCircleSource extends vtkCircleSourceBase {

	/**
	 * Get the center of the cone.
	 * @default [0, 0, 0]
	 */
	getCenter(): Vector3;

	/**
	 * Get the center of the cone.
	 */
	getCenterByReference(): Vector3;

	/**
	 * Get the orientation vector of the cone.
	 * @default [1.0, 0.0, 0.0]
	 */
	getDirection(): Vector3;

	/**
	 * Get the orientation vector of the cone.
	 */
	getDirectionByReference(): Vector3;

	/**
	 *
	 * @default true
	 */
	getFace(): boolean;

	/**
	 *
	 * @default false
	 */
	getLines(): boolean;

	/**
	 * Get the radius of the cylinder base.
	 * @default 1.0
	 */
	getRadius(): number;

	/**
	 * Get the number of facets used to define cylinder.
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
	 * Set the direction for the circle.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setDirection(x: number, y: number, z: number): boolean;

	/**
	 * Set the direction for the circle.
	 * @param {Vector3} direction The direction coordinates.
	 */
	setDirection(direction: Vector3): boolean;

	/**
	 * Set the direction for the circle.
	 * @param {Vector3} direction The direction coordinates.
	 */
	setDirectionFrom(direction: Vector3): boolean;

	/**
	 * Set the center of the circle.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 * @default [0, 0, 0]
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the circle.
	 * @param {Vector3} center 
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: Vector3): boolean;

	/**
	 *
	 * @param {Boolean} face 
	 */
	setFace(face: boolean): boolean;

	/**
	 *
	 * @param {Boolean} lines 
	 */
	setLines(lines: boolean): boolean;

	/**
	 * Set the radius of the circle.
	 * @param {Number} radius The radius of the circle.
	 */
	setRadius(radius: number): boolean;

	/**
	 * Set the resolution of the circle.
	 * @param {Number} resolution The resolution of the circle.
	 */
	setResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCircleSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICircleSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICircleSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkCircleSource.
 * @param {ICircleSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICircleSourceInitialValues): vtkCircleSource;

/**
/**
 * vtkCircleSource creates a circle.
 * 
 * @example
 * ```js
 * import vtkCircleSource from '@kitware/vtk.js/Filters/Sources/CircleSource';
 * 
 * const circle = vtkCircleSource.newInstance({ radius: 1, resolution: 80 });
 * const polydata = circle.getOutputData();
 * ```
 */
export declare const vtkCircleSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCircleSource;
