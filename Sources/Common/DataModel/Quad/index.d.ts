import { Vector3, Vector4 } from '../../../types';
import vtkCell, { ICellInitialValues } from '../Cell';
import { IIntersectWithLine } from '../Triangle';

export interface IQuadInitialValues extends ICellInitialValues {}

export interface vtkQuad extends vtkCell {
  getCellType(): number;
  /**
   * Get the topological dimensional of the cell (0, 1, 2 or 3).
   */
  getCellDimension(): number;
  getNumberOfEdges(): number;
  getNumberOfFaces(): number;

  /**
   * Compute the intersection point of the intersection between quad and
   * line defined by p1 and p2. tol Tolerance use for the position evaluation
   * x is the point which intersect triangle (computed in function) pcoords
   * parametric coordinates (computed in function) A javascript object is
   * returned :
   *
   * ```js
   * {
   *    evaluation: define if the triangle has been intersected or not
   *    subId: always set to 0
   *    t: parametric coordinate along the line.
   *    betweenPoints: Define if the intersection is between input points
   * }
   * ```
   *
   * @param {Vector3} p1 The first point coordinate.
   * @param {Vector3} p2 The second point coordinate.
   * @param {Number} tol The tolerance to use.
   * @param {Vector3} x The point which intersect triangle.
   * @param {Vector3} pcoords The parametric coordinates.
   */
  intersectWithLine(
    p1: Vector3,
    p2: Vector3,
    tol: number,
    x: Vector3,
    pcoords: Vector3
  ): IIntersectWithLine;

  /**
   * Determine global coordinate (x]) from subId and parametric coordinates.
   * @param {Vector3} pcoords The parametric coordinates.
   * @param {Vector3} x The x point coordinate.
   * @param {Number[]} weights The number of weights.
   */
  evaluateLocation(pcoords: Vector3, x: Vector3, weights: number[]): void;

  /*
   *  Compute iso-parametric interpolation functions
   * @param {Vector3} pcoords The parametric coordinates.
   * @param {Vector4} sf out weights.
   */
  interpolationFunctions(pcoords: Vector3, sf: Vector4);
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkQuad characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IQuadInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IQuadInitialValues
): void;

/**
 * Method used to create a new instance of vtkQuad.
 * @param {IQuadInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IQuadInitialValues): vtkQuad;

/**
 * vtkQuad is a cell which represents a quadrilateral. It may contain static
 * methods to make some computations directly link to quads.
 *
 * @see vtkCell
 */
export declare const vtkQuad: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkQuad;
