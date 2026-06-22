import { vtkAlgorithm, vtkObject } from '../../../interfaces';

export interface IReverseSenseInitialValues {
  reverseCells?: boolean;
  reverseNormals?: boolean;
}

type vtkReverseSenseBase = vtkObject & vtkAlgorithm;

export interface vtkReverseSense extends vtkReverseSenseBase {
  /**
   * Get whether the order of polygonal cells is reversed.
   */
  getReverseCells(): boolean;

  /**
   * Get whether the direction of point and cell normals is reversed.
   */
  getReverseNormals(): boolean;

  /**
   * Request data from the input and produce output.
   * @param inData The input data.
   * @param outData The output data.
   */
  requestData(inData: any, outData: any): void;

  /**
   * Controls whether the order of polygonal cells is reversed.
   * @param {Boolean} reverseCells The new state of the `reverseCells` flag.
   */
  setReverseCells(reverseCells: boolean): boolean;

  /**
   * Controls whether the direction of point and cell normals is reversed.
   * @param {Boolean} reverseNormals The new state of the `reverseNormals` flag.
   */
  setReverseNormals(reverseNormals: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkReverseSense characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IReverseSenseInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IReverseSenseInitialValues
): void;

/**
 * Method used to create a new instance of vtkReverseSense.
 * @param {IReverseSenseInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IReverseSenseInitialValues
): vtkReverseSense;

/**
 * vtkReverseSense is a filter that reverses the order of polygonal cells and/or reverses the direction of point and cell normals.
 * Two flags are used to control these operations: `reverseCells` and `reverseNormals`.
 * Cell reversal means reversing the order of indices in the cell connectivity list.
 * Normal reversal means multiplying the normal vector by -1 (both point and cell normals, if present).
 */
export declare const vtkReverseSense: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkReverseSense;
