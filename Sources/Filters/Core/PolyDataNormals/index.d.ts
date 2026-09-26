import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';

/**
 *
 */
export interface IPolyDataNormalsInitialValues {
  /**
   * Whether a normal is computed for every cell of the input.
   * @default false
   */
  computeCellNormals?: boolean;

  /**
   * Whether a normal is computed for every point of the input.
   * @default true
   */
  computePointNormals?: boolean;
}

type vtkPolyDataNormalsBase = vtkObject & vtkAlgorithm;

export interface vtkPolyDataNormals extends vtkPolyDataNormalsBase {
  /**
   * Get whether a normal is computed for every cell of the input.
   * @default false
   */
  getComputeCellNormals(): boolean;

  /**
   * Get whether a normal is computed for every point of the input.
   * @default true
   */
  getComputePointNormals(): boolean;

  /**
   * Controls whether a normal is computed for every cell of the input.
   *
   * @param {Boolean} computeCellNormals
   */
  setComputeCellNormals(computeCellNormals: boolean): boolean;

  /**
   * Controls whether a normal is computed for every point of the input.
   *
   * @param {Boolean} computePointNormals
   */
  setComputePointNormals(computePointNormals: boolean): boolean;

  /**
   * Compute the cell normals and the point normals of a set of polygons, and
   * return them as a `[cellNormals, pointNormals]` pair.
   *
   * A point normal is the normalized sum of the normals of the cells the point
   * belongs to. It is only accumulated when `computePointNormals` is on;
   * otherwise the returned point normals are left zeroed. Returns `null` when
   * `pointsData` is not given.
   *
   * @param {Number} numberOfPolys The number of polygons described by `polysData`.
   * @param {Number[]|TypedArray} polysData The polygon connectivity, as
   * successive runs of a point count followed by that many point ids. Runs of
   * fewer than three points are skipped.
   * @param {Number[]|TypedArray} pointsData The flat (x, y, z) point coordinates.
   */
  vtkPolyDataNormalsExecute(
    numberOfPolys: number,
    polysData: number[] | TypedArray,
    pointsData: Nullable<number[] | TypedArray>
  ): Nullable<[Float32Array, Float32Array]>;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPolyDataNormals characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPolyDataNormalsInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IPolyDataNormalsInitialValues
): void;

/**
 * Method used to create a new instance of vtkPolyDataNormals.
 * @param {IPolyDataNormalsInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IPolyDataNormalsInitialValues
): vtkPolyDataNormals;

/**
 * vtkPolyDataNormals is a filter that computes point and/or cell normals for a
 * vtkPolyData. The input points, cells and data arrays are passed through
 * unchanged; only the `Normals` arrays are added to the output.
 */
declare const vtkPolyDataNormals: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkPolyDataNormals;
