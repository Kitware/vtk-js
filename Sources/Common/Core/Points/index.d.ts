import vtkDataArray from '../../../Common/Core/DataArray';
import { Bounds, TypedArray } from '../../../types';

/**
 *
 */
export interface IPointsInitialValues {
	empty?: boolean;
	numberOfComponents?: number;
	bounds?: Bounds;
}

export interface vtkPoints extends vtkDataArray {

	/**
	 * Trigger the computation of bounds
	 */
	computeBounds(): Bounds;

	/**
	 * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Get the coordinate of a point.
	 * @param {Number} idx The index of point.
	 * @param {Number[]|TypedArray} [tupleToFill] (default [])
	 * @returns {Number[]|TypedArray}
	 */
	getPoint(idx: number, tupleToFill?: number[]|TypedArray): number[]|TypedArray;

	/**
	 * Get the number of points for this object can hold.
	 */
	getNumberOfPoints(): number;

	/**
	 * Set the number of points for this object to hold.
	 * 
	 * ```js
	 * points.getData()[0] = x;
	 * points.getData()[1] = y;
	 * points.getData()[2] = z;
	 * ```
	 * 
	 * @param {Number} nbPoints 
	 * @param {Number} [dimension] 
	 */
	setNumberOfPoints(nbPoints: number, dimension?: number): void;

	/**
	 * Set the (x,y,z) coordinates of a point based on its index.
	 * @param {Number} idx The index of point.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	setPoint(idx: number, x: number, y: number, z: number): void;

	/**
	 * Insert the (x,y,z) coordinates of a point at the next available slot.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Number} z The z coordinate.
	 */
	insertNextPoint(x: number, y: number, z: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPoints characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPointsInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPointsInitialValues): void;

/**
 * Method used to create a new instance of vtkPoints
 * @param {IPointsInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPointsInitialValues): vtkPoints;


/**
 * vtkPoints represents 3D points. The data model for vtkPoints is an array 
 * of vx-vy-vz triplets accessible by (point or cell) id.
 */

export declare const vtkPoints: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkPoints;
