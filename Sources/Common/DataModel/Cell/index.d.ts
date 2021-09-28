import { vtkObject } from "../../../interfaces" ;
import { Bounds, Vector3 } from "../../../types";
import vtkPoints from '../../Core/Points';

export interface ICellInitialValues {
	bounds?: Bounds;
	pointsIds?: number[];
}

export interface vtkCell extends vtkObject {

	/**
	 * Copy this cell by completely copying internal data structures.
	 * @param {vtkCell} cell The cell you want to use.
	 */
	deepCopy(cell: vtkCell): void;

	/**
	 * Initialize the cell with point coordinates and cell point ids, example :
	 * 
	 * ```js
	 * const points = vtkPoints.newInstance();
	 * points.setData(Float32Array.from([0, 0, 0, 0, 0, 1, ..., 255, 255, 255]));
	 * const pointIdsList = [13, 10, 235];
	 * // Create cell
	 * const triangle = vtkTriangle.newInstance();
	 * // Initialize cell
	 * triangle.initialize(points, pointIdsList);
	 * ```
	 * 
	 * If pointIdsList is null, points are shallow copied and pointIdsList is
	 * generated as such: [0, 1, ..., N-1] where N is the number of points. If
	 * pointIdsList is not null, only pointIdsList point coordinates are copied into
	 * the cell. pointIdsList is shallow copied.
	 * @param {vtkPoints} points 
	 * @param {Number[]} [pointIdsList] 
	 */
	initialize(points: vtkPoints, pointIdsList?: number[]): void;

	/**
	 * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
	 * @return {Bounds} The bounds for the mapper.
	 */
	getBounds(): Bounds;

	/**
	 * Compute Length squared of cell (i.e., bounding box diagonal squared).
	 */
	getLength2(): number;

	/**
	 * Get the distance of the parametric coordinate provided to the cell. If
	 * inside the cell, a distance of zero is returned. This is used during
	 * picking to get the correct cell picked. (The tolerance will occasionally
	 * allow cells to be picked who are not really intersected "inside" the
	 * cell.)
	 * @param {Vector3} pcoords The coordinates of the point.
	 *
	 */
	getParametricDistance(pcoords: Vector3): number;

	/**
	 * 
	 */
	getPoints(): vtkPoints;

	/**
	 * 
	 */
	getPointsIds(): number[];

	/**
	 * Get the number of points in the cell.
	 */
	getNumberOfPoints(): number;

	// getCellDimension(): void;
	// intersectWithLine(p1: any, p2: any, tol: any, t: any, x: any, pcoords: any, subId: any): void;
	// evaluatePosition(x: Vector3, closestPoint: Vector3, subId: number, pcoords: Vector3, dist2: number, weights: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCell characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICellInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ICellInitialValues): void;

/**
 * Method used to create a new instance of vtkCell.
 * @param {ICellInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ICellInitialValues): vtkCell;

/**
 * vtkCell is an abstract method to define a cell
 */
export declare const vtkCell: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkCell;
