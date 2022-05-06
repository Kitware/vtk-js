import { Vector2, Vector3 } from '../../../types';
import vtkCell, { ICellInitialValues } from '../Cell';
import { IIntersectWithLine } from '../Line';

export interface IPolyLineInitialValues extends ICellInitialValues { }

export interface vtkPolyLine extends vtkCell {

	/**
	 * Get the topological dimensional of the cell (0, 1, 2 or 3).
	 */
	getCellDimension(): number;

	/**
	 * @param {number} t1
	 * @param {number} t2
	 * @param {Vector3} p1 The first point coordinate.
	 * @param {Vector3} p2 The second point coordinate.
	 * @param {Number} tol The tolerance to use.
	 * @param {Vector3} x The point which intersect the line.
	 * @param {Vector3} pcoords The parametric coordinates.
	 */
	intersectWithLine(t1: number, t2: number, p1: Vector3, p2: Vector3, tol: number, x: Vector3, pcoords: Vector3): IIntersectWithLine;

  /**
   * Determine global coordinate (x[3]) from subId and parametric coordinates.
   * Also returns interpolation weights. (The number of weights is equal to
   * the number of points in the cell.)
   * 
   * @param {number} subId
   * @param {Vector3} pcoords The parametric coordinates
   * @param {Vector3} x The global coordinate
   * @param {Vector2} weights The interpolation weights
   */
  evaluateLocation(subId: number, pcoords: Vector3, x: Vector3, weights: Vector2): void
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolyLine characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolyLineInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPolyLineInitialValues): void;

/**
 * Method used to create a new instance of vtkPolyLine.
 * @param {IPolyLineInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPolyLineInitialValues): vtkPolyLine;

/** 
 * vtkPolyLine is a cell which representant a poly line.
 * 
 * @see vtkCell
 */
export declare const vtkPolyLine: {
	newInstance: typeof newInstance,
	extend: typeof extend;
};

export default vtkPolyLine;
