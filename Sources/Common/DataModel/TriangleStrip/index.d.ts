import { CellType, Vector3 } from '../../../types';
import vtkCellArray from '../../Core/CellArray';
import vtkPoints from '../../Core/Points';
import vtkCell, { ICellInitialValues } from '../Cell';
import vtkLine from '../Line';
import vtkTriangle from '../Triangle';

export interface ITriangleStripInitialValues extends ICellInitialValues {
  line?: vtkLine;
  triangle?: vtkTriangle;
}

export interface vtkTriangleStrip extends vtkCell {
  /**
   * Get the cell boundary of the triangle strip.
   * @param {Number} subId The sub-id of the cell.
   * @param {Vector3} pcoords The parametric coordinates.
   * @param {Vector3[]} pts The points of the cell.
   */
  cellBoundary(subId: number, pcoords: Vector3, pts: Vector3[]): boolean;

  /**
   * Derivatives of the triangle strip.
   * @param {Number} subId - The sub-id of the triangle.
   * @param {Vector3} pcoords - The parametric coordinates.
   * @param {Number[]} values - The values at the points.
   * @param {Number} dim - The dimension.
   * @param {Number[]} derivs - The derivatives.
   */
  derivatives(
    subId: number,
    pcoords: Vector3,
    values: number[],
    dim: number,
    derivs: number[]
  ): void;

  /**
   * Evaluate the location of a point in the triangle strip.
   * @param {Vector3} pcoords The parametric coordinates of the point.
   * @param {Vector3} closestPoint The closest point on the triangle strip.
   * @param {Number[]} weights The interpolation weights.
   */
  evaluateLocation(
    pcoords: Vector3,
    closestPoint: Vector3,
    weights: number[]
  ): number;

  /**
   * Evaluate the position of a point in the triangle strip.
   * @param {Vector3} x The point to evaluate.
   * @param {Vector3} closestPoint The closest point on the triangle strip.
   * @param {Vector3} pcoords The parametric coordinates.
   * @param {Number[]} dist2 The squared distance from the point to the triangle strip.
   * @param {Number[]} weights The interpolation weights.
   */
  evaluatePosition(
    x: Vector3,
    closestPoint: Vector3,
    pcoords: Vector3,
    dist2: number[],
    weights: number[]
  ): number;

  /**
   * Get the cell type.
   */
  getCellType(): CellType;

  /**
   * Get the topological dimensional of the cell (0, 1, 2 or 3).
   */
  getCellDimension(): number;

  /**
   * Get the edge of the triangle strip.
   * @param {Number} edgeId The edge ID to retrieve.
   * @returns {vtkLine} The edge corresponding to the edge ID.
   */
  getEdge(edgeId: number): vtkLine;

  /**
   * Get the number of edges in the triangle strip.
   */
  getNumberOfEdges(): number;

  /**
   * Get the number of faces in the triangle strip.
   */
  getNumberOfFaces(): number;

  /**
   * Get the parametric center of the triangle strip.
   * @param {Vector3} pcoords - The parametric coordinates.
   * @returns {Number} The parametric center.
   */
  getParametricCenter(pcoords: Vector3): number;

  /**
   * Get the point array of the triangle strip.
   * @returns {Number[]} The point array.
   */
  getPointArray(): number[];

  /**
   * Initialize the triangle strip with points and point IDs.
   * @param {vtkPoints} points The points of the triangle strip.
   * @param {Number[]} pointsIds The point IDs of the triangle strip.
   */
  initialize(points: vtkPoints, pointsIds: number[]): void;

  /**
   * Intersects a line with the triangle strip.
   * @param {Vector3} p1 Start point of the line
   * @param {Vector3} p2 End point of the line
   * @param {Number} tol Tolerance for intersection
   * @param {Vector3} x Intersection point
   * @param {Vector3} pcoords Parametric coordinates of the intersection
   * @returns {Boolean} True if the line intersects the triangle strip
   */
  intersectWithLine(
    p1: Vector3,
    p2: Vector3,
    tol: number,
    x: Vector3,
    pcoords: Vector3
  ): boolean;

  /**
   * Triangulate the triangle strip.
   * @returns {Boolean} True if the triangulation is successful.
   */
  triangulate(): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTriangle characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITriangleStripInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITriangleStripInitialValues
): void;

/**
 * Method used to create a new instance of vtkTriangle.
 * @param {ITriangleStripInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITriangleStripInitialValues
): vtkTriangleStrip;

/**
 * Decomposes a triangle strip into individual triangles.
 * @param {vtkPoints} pts Points of the triangle strip
 * @param {vtkCellArray} polys Cell array to store the resulting triangles
 */
export function decomposeStrip(pts: vtkPoints, polys: vtkCellArray): void;

/**
 * vtkTriangleStrip is a concrete implementation of vtkCell to represent a 2D
 * triangle strip. A triangle strip is a compact representation of triangles
 * connected edge to edge in strip fashion. The connectivity of a triangle strip
 * is three points defining an initial triangle, then for each additional
 * triangle, a single point that, combined with the previous two points, defines
 * the next triangle.
 *
 * @see vtkCell
 */
export declare const vtkTriangleStrip: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  decomposeStrip: typeof decomposeStrip;
};
export default vtkTriangleStrip;
