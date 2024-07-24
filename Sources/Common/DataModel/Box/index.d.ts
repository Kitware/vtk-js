import { vtkObject } from '../../../interfaces';
import { Bounds, Vector3 } from '../../../types';

export interface IBoxInitialValues {
  bbox?: Bounds;
}

export interface IBoxIntersections {
  t1;
  t2: number;
  x1;
  x2: Vector3;
}

export interface vtkBox extends vtkObject {
  /**
   * Add the bounds for the box.
   * @param {Bounds} bounds
   */
  addBounds(bounds: Bounds): void;

  /**
   *
   * @param other
   */
  addBox(other: any): void;

  /**
   *
   * @param {Vector3} x The point coordinate.
   */
  evaluateFunction(x: Vector3): number;

  /**
   * Intersect box with line and return the parametric values and points of the two intercepts
   * @param bounds
   * @param p1
   * @param p2
   * returns @object IBoxIntersections {t1, t2, x1, x2} object containing the t1, t2 parametric values and
   * x1, x2 coordinates of the line intercept points in the bounding box or undefined
   */
  intersectWithLine(p1: Vector3, p2: Vector3): IBoxIntersections | undefined;

  /**
   *
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  evaluateFunction(x: number, y: number, z: number): number;

  /**
   * Get the bounds for the box.
   */
  getBounds(): Bounds;

  /**
   * Set the bounds for the box.
   * @param {Bounds} bounds The bounds for the box.
   */
  setBounds(bounds: Bounds): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkBox characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IBoxInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IBoxInitialValues
): void;

/**
 * Method used to create a new instance of vtkBox.
 * @param {IBoxInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IBoxInitialValues): vtkBox;

//------------------------------------------------------------------------------
// Bounding box intersection code from David Gobbi.  Go through the
// bounding planes one at a time and compute the parametric coordinate
// of each intersection and return the parametric values and the calculated points
export function intersectWithLine(
  bounds,
  p1,
  p2
): IBoxIntersections | undefined;

/**
 * vtkBox provides methods for creating a 1D cubic spline object from given
 * parameters, and allows for the calculation of the spline value and derivative
 * at any given point inside the spline intervals.
 */
export declare const vtkBox: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  intersectWithLine: typeof intersectWithLine;
};
export default vtkBox;
