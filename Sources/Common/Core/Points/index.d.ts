import { VtkDataArray } from "vtk.js/Sources/macro";

/**
 *
 */
interface IPointsInitialValues {
	empty?: boolean;
	numberOfComponents?: number;
	bounds?: number[];
}

export interface vtkPoints extends VtkDataArray {

	/**
	 * Trigger the computation of bounds
	 */
	computeBounds(): number[];

	/**
	 * Get the bounds as [xmin, xmax, ymin, ymax, zmin, zmax].
	 */
	getBounds(): number[];

	/**
	* @param {number} idx
	* @param {number[]} [tupleToFill]
	* @default []
	*/
	getPoint(idx: number, tupleToFill?: number[]): number[];

	/**
	 * Get the number of points for this object can hold.
	 */
	getNumberOfPoints(): number;

	/**
	 * Set the number of points for this object to hold.
	 * @param {number} nbPoints
	 * @param {number} [dimension]
	 */
	setNumberOfPoints(nbPoints: number, dimension?: number): void;

	/**
	 * Insert point into object.
	 * @param {number} idx
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	setPoint(idx: number, x: number, y: number, z: number): void;

	/**
	 * Insert point into object.
	 * @param {number} idx
	 * @param {number[]} coord
	 */
	setPoint(idx: number, coord: number[]): void;
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
 * @param initialValues for pre-setting some of its content
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
