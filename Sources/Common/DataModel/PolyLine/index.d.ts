import { quat } from 'gl-matrix';
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
   * Also set interpolation weights. (There are two weights for the two
   * points of the line segment specified by subId)
   * 
   * @param {number} subId
   * @param {Vector3} pcoords The parametric coordinates
   * @param {Vector3} x The global coordinate
   * @param {Vector2} weights The interpolation weights
   */
  evaluateLocation(subId: number, pcoords: Vector3, x: Vector3, weights: Vector2): void

  /**
   * Determine global orientation (q[3]) from subId and parametric coordinates.
   * This uses the same algorithm as vtkLine (interpolates using slerp).
   * Also set interpolation weights. (There are two weights for the two
   * points of the line segment specified by subId)
   * 
   * @param {number} subId
   * @param {Vector3} pcoords The parametric coordinates
   * @param {Vector3} q The global orientation
   * @param {Vector2} weights The interpolation weights
   * @returns {boolean} Wether the orientation has been set in `q'
   */
  evaluateOrientation(subId: number, pcoords: Vector3, q: quat, weights: Vector2): boolean

  /**
   * Returns an array containing for each pointIdx between 0 (included) and
   * numberOfPoints (excluded) the distance from the first point of the
   * polyline to the point at pointIdx
   * In particular if tda = publicAPI.getDistancesToFirstPoint(), then tda[0] = 0
   * and tda[tda.length - 1] is the total length of the polyline
   */
  getDistancesToFirstPoint(): number[]

  /**
   * Returns the subId of the segment at the given distance from the first
   * point of the polyline
   * If the distance is negative or greater than the total length of the
   * polyline, returns -1
   * 
   * @param distance The distance from the first point of the polyline
   */
  findPointIdAtDistanceFromFirstPoint(distance: number): number;
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
