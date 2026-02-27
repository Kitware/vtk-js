import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 * Initial values for vtkFillHolesFilter.
 */
export interface IFillHolesFilterInitialValues {
  holeSize?: number;
}

type vtkFillHolesFilterBase = vtkObject & vtkAlgorithm;

export interface vtkFillHolesFilter extends vtkFillHolesFilterBase {
  /**
   * Expose methods.
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Get the maximum hole size to fill.
   */
  getHoleSize(): number;

  /**
   * Set the maximum hole size to fill.
   * @param holeSize
   */
  setHoleSize(holeSize: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkFillHolesFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IFillHolesFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IFillHolesFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkFillHolesFilter.
 * @param {IFillHolesFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IFillHolesFilterInitialValues
): vtkFillHolesFilter;

/**
 * vtkFillHolesFilter is a filter that identifies and fills holes in input vtkPolyData meshes.
 * Holes are identified by locating boundary edges, linking them together into loops,
 * and then triangulating the resulting loops. Note that you can specify an approximate
 * limit to the size of the hole that can be filled.
 *
 * The VTK.js implementation follows the same algorithmic approach as VTK C++.
 */
export declare const vtkFillHolesFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkFillHolesFilter;
