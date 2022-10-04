import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector3 } from "../../../types";

/**
 *
 */
export interface ILineSourceInitialValues {
	resolution?: number;
	point1?: Vector3;
	point2?: Vector3;
	pointType?: string;
}

type vtkLineSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkLineSource extends vtkLineSourceBase {

	/**
	 * Get the starting point of the line.
	 * @default [-1, 0, 0]
	 */
	getPoint1(): Vector3;

	/**
	 * Get the starting point of the line.
	 */
	getPoint1ByReference(): Vector3;

	/**
	 * Get the ending point of the line.
	 * @default [1, 0, 0]
	 */
	getPoint2(): Vector3;

	/**
	 * Get the ending point of the line.
	 */
	getPoint2ByReference(): Vector3;

	/**
	 * Get the resolution of the line.
	 * @default 6
	 */
	getResolution(): number;

	/**
	 * 
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the starting point of the line.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPoint1(x: number, y: number, z: number): boolean;

	/**
	 * Set the starting point of the line.
	 * @param {Vector3} point1 The starting point's coordinates.
	 */
	setPoint1(point1: Vector3): boolean;

	/**
	 * Set the starting point of the line.
	 * @param {Vector3} point1 The starting point's coordinates.
	 */
	setPoint1From(point1: Vector3): boolean;

	/**
	 * Set the ending point of the line.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPoint2(x: number, y: number, z: number): boolean;

	/**
	 * Set the ending point of the line.
	 * @param {Vector3} point2 The ending point's coordinates.
	 */
	setPoint2From(point2: Vector3): boolean;

	/**
	 * Set the number of segments used to represent the line.
	 * @param {Number} resolution The number of segments.
	 */
	setResolution(resolution: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkLineSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ILineSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ILineSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkLineSource.
 * @param {ILineSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ILineSourceInitialValues): vtkLineSource;

/**
 * vtkLineSource creates a line segment from point1 to point2;
 * The resolution can be specified, which determines the number of points along the line.
 * Following a vtkLineSource by a vtkTubeFilter is a convenient way to create a cylinder based on endpoints.
 * 
 * @example
 * ```js
 * import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
 * 
 * const line = vtkLineSource.newInstance({ resolution: 10 });
 * const polydata = line.getOutputData();
 * ```
 */
export declare const vtkLineSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkLineSource;
