import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector3 } from "../../../types";

export enum ShapeType {
	TRIANGLE,
	STAR,
	ARROW_4,
	ARROW_6
}

/**
 *
 */
export interface IArrow2DSourceInitialValues {
	base?: number;
	height?: number;
	width?: number;
	thickness?: number;
	center?: Vector3;
	pointType?: string;
	origin?: Vector3;
	direction?: Vector3;
}

type vtkArrow2DSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkArrow2DSource extends vtkArrow2DSourceBase {

	/**
	 * Get the cap the base of the cone with a polygon.
	 * @default 0
	 */
	getBase(): number;

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
	 * Get the height of the cone.
	 * @default 1.0
	 */
	getHeight(): number;

	/**
	 * Get the base thickness of the cone.
	 * @default 0.5
	 */
	getThickness(): number;

	/**
	 * Get the number of facets used to represent the cone.
	 * @default 6
	 */
	getWidth(): number;

	/**
	 * Expose methods
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Turn on/off whether to cap the base of the cone with a polygon.
	 * @param {Number} base The value of the 
	 */
	setBase(base: number): boolean;

	/**
	 * Set the center of the cone.
	 * It is located at the middle of the axis of the cone.
	 * !!! warning
	 *     This is not the center of the base of the cone!
	 * @param {Number} x The x coordinate.
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
	 * @param {Vector3} center The center of the cone coordinates.
	 * @default [0, 0, 0]
	 */
	setCenterFrom(center: Vector3): boolean;

	/**
	 * Set the direction for the arrow.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setDirection(x: number, y: number, z: number): boolean;

	/**
	 * Set the direction for the arrow 2D.
	 * @param {Vector3} direction The direction coordinates.
	 */
	setDirection(direction: Vector3): boolean;

	/**
	 * Set the direction for the arrow 2D.
	 * @param {Vector3} direction The direction coordinates.
	 */
	setDirectionFrom(direction: Vector3): boolean;

	/**
	 * Set the height of the cone.
	 * This is the height along the cone in its specified direction.
	 * @param {Number} height The height value.
	 */
	setHeight(height: number): boolean;

	/**
	 * Set the base thickness of the cone.
	 * @param {Number} thickness The thickness value.
	 */
	setThickness(thickness: number): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param {Number} width The width value.
	 */
	setWidth(width: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkArrow2DSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IArrow2DSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IArrow2DSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkArrow2DSource.
 * @param {IArrow2DSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IArrow2DSourceInitialValues): vtkArrow2DSource;

/**
 * vtkArrow2DSource creates a cone centered at a specified point and pointing in a specified direction.
 * (By default, the center is the origin and the direction is the x-axis.) Depending upon the resolution of this object,
 * different representations are created. If resolution=0 a line is created; if resolution=1, a single triangle is created;
 * if resolution=2, two crossed triangles are created. For resolution > 2, a 3D cone (with resolution number of sides)
 * is created. It also is possible to control whether the bottom of the cone is capped with a (resolution-sided) polygon,
 * and to specify the height and thickness of the cone.
 */
export declare const vtkArrow2DSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkArrow2DSource;
