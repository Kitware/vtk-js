import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Vector3 } from '../../../types';

/**
 *
 */
export interface IShrinkPolyDataInitialValues {
  shrinkFactor?: number;
}

type vtkShrinkPolyDataBase = vtkObject & vtkAlgorithm;

export interface vtkShrinkPolyData extends vtkShrinkPolyDataBase {
  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Get the shrink factor.
   */
  getShrinkFactor(): number;

  /**
   * Set the shrink factor.
   * @param {Number} shrinkFactor
   */
  setShrinkFactor(shrinkFactor: number): boolean;

  /**
   * Shrink two points towards their midpoint by a shrink factor.
   * @param {Vector3} p1 - The [x, y, z] coordinates of the first point
   * @param {Vector3} p2 - The [x, y, z] coordinates of the second point
   * @param {number} shrinkFactor - The shrink factor (0.0 to 1.0)
   * @param {Number[]} [shrunkPoints] - Optional array to store the shrunk points
   * @returns {Number[]} Array containing the two new points
   */
  shrinkLine(
    p1: Vector3,
    p2: Vector3,
    shrinkFactor: number,
    shrunkPoints?: Number[]
  ): Number[];
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkShrinkPolyData characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IShrinkPolyDataInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IShrinkPolyDataInitialValues
): void;

/**
 * Method used to create a new instance of vtkShrinkPolyData.
 * @param {IShrinkPolyDataInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IShrinkPolyDataInitialValues
): vtkShrinkPolyData;

/**
 * vtkShrinkPolyData shrinks cells composing a polygonal dataset (e.g.,
 * vertices, lines, polygons, and triangle strips) towards their centroid. The
 * centroid of a cell is computed as the average position of the cell points.
 * Shrinking results in disconnecting the cells from one another. The output
 * dataset type of this filter is polygonal data.
 *
 * During execution the filter passes its input cell data to its output. Point
 * data attributes are copied to the points created during the shrinking
 * process.
 */
export declare const vtkShrinkPolyData: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkShrinkPolyData;
