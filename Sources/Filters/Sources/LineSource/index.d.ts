import { VtkAlgorithm, VtkObject } from 'vtk.js/Sources/macro';

/**
 *
 */
interface ILineSourceInitialValues {
	resolution?: number;
	point1?: number[];
	point2?: number[];
	pointType?: string;
}

type vtkLineSourceBase = VtkObject & Omit<VtkAlgorithm,
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
	getPoint1(): number[];

	/**
	 * Get the starting point of the line.
	 */
	getPoint1ByReference(): number[];

	/**
	 * Get the ending point of the line.
	 * @default [1, 0, 0]
	 */
	getPoint2(): number[];

	/**
	 * Get the ending point of the line.
	 */
	getPoint2ByReference(): number[];

	/**
	 * Get the x resolution of the line.
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
	 * @param {Number[]} point1 The starting point's coordinates.
	 */
	setPoint1(point1: number[]): boolean;

	/**
	 * Set the starting point of the line.
	 * @param {Number[]} point1 The starting point's coordinates.
	 */
	setPoint1From(point1: number[]): boolean;

	/**
	 * Set the ending point of the line.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPoint2(x: number, y: number, z: number): boolean;

	/**
	 * Set the ending point of the line.
	 * @param {Number[]} point2 The ending point's coordinates.
	 */
	setPoint2From(point2: number[]): boolean;

	/**
	 * Set the number of facets used to represent the cone.
	 * @param {Number} resolution The number of facets.
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
 * vtkLineSource creates a polygonal cylinder centered at Center;
 * The axis of the cylinder is aligned along the global y-axis.
 * The height and radius of the cylinder can be specified, as well as the number of sides.
 * It is also possible to control whether the cylinder is open-ended or capped.
 * If you have the end points of the cylinder, you should use a vtkLineSource followed by a vtkTubeFilter instead of the vtkLineSource.
 * 
 * @example
 * ```js
 * import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
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
