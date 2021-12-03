import { vtkAlgorithm, vtkObject } from "../../../interfaces";
import { Vector3 } from "../../../types";

/**
 * 
 */
export interface IPointSourceInitialValues {
	numberOfPoints?: number;
	center?: Vector3;
	radius?: number;
	pointType?: string;
}

type vtkPointSourceBase = vtkObject & Omit<vtkAlgorithm,
	| 'getInputData'
	| 'setInputData'
	| 'setInputConnection'
	| 'getInputConnection'
	| 'addInputConnection'
	| 'addInputData'>;

export interface vtkPointSource extends vtkPointSourceBase {

	/**
	 * Get the center of the plane.
	 * @default [0, 0, 0]
	 */
	getCenter(): Vector3;

	/**
	 * Get the center of the plane.
	 */
	getCenterByReference(): Vector3;

	/**
	 * Get the number of points to generate.
	 * @default 10
	 */
	getNumberOfPoints(): number;

	/**
	 * Get the radius of the point cloud.
	 * @default 0.5
	 */
	getRadius(): number;

	/**
	 * 
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	/**
	 * Set the center of the point cloud.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setCenter(x: number, y: number, z: number): boolean;

	/**
	 * Set the center of the point cloud.
	 * @param {Vector3} center The center point's coordinates.
	 */
	setCenter(center: Vector3): boolean;

	/**
	 * Set the center of the point cloud.
	 * @param {Vector3} center The center point's coordinates.
	 */
	setCenterFrom(center: Vector3): boolean;

	/**
	 * Set the number of points to generate.
	 * @param {Number} numberOfPoints The number of points to generate.
	 */
	setNumberOfPoints(numberOfPoints: number): boolean;

	/**
	 * Set the radius of the point cloud. If you are generating a Gaussian
	 * distribution, then this is the standard deviation for each of x, y, and
	 * z.
	 * @param {Number} radius The radius value.
	 */
	setRadius(radius: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPointSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPointSourceInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPointSourceInitialValues): void;

/**
 * Method used to create a new instance of vtkPointSource.
 * @param {IPointSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPointSourceInitialValues): vtkPointSource;

/**
 * vtkPointSource is a source object that creates a user-specified number of
 * points within a specified radius about a specified center point. By default
 * location of the points is random within the sphere. It is also possible to
 * generate random points only on the surface of the sphere. The output PolyData
 * has the specified number of points and 1 cell - a vtkPolyVertex containing
 * all of the points.
 * 
 * @example
 * ```js
 * import vtkPointSource from '@kitware/vtk.js/Filters/Sources/PointSource';
 * 
 * const point = vtkPointSource.newInstance({ numberOfPoints: 10 });
 * const polydata = point.getOutputData();
 * ```
 */
export declare const vtkPointSource: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPointSource;
