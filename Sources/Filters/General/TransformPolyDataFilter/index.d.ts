import { DesiredOutputPrecision } from '../../../Common/DataModel/DataSetAttributes';
import vtkTransform from '../../../Common/Transform/Transform';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';

export interface ITransformPolyDataFilterInitialValues {
  transform?: vtkTransform;
  outputPointsPrecision?: DesiredOutputPrecision;
}

type vtkTransformPolyDataFilterBase = vtkObject & vtkAlgorithm;

export interface vtkTransformPolyDataFilter
  extends vtkTransformPolyDataFilterBase {
  /**
   * Get the transform used by this filter.
   */
  getTransform(): vtkTransform;

  /**
   * Get the output points precision.
   */
  getOutputPointsPrecision(): DesiredOutputPrecision;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the output points precision.
   * @param {DesiredOutputPrecision} precision
   */
  setOutputPointsPrecision(precision: DesiredOutputPrecision): boolean;

  /**
   * Set the transform used by this filter.
   * @param {vtkTransform} transform
   */
  setTransform(transform: vtkTransform): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkTransformPolyDataFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ITransformPolyDataFilterInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ITransformPolyDataFilterInitialValues
): void;

/**
 * Method used to create a new instance of vtkTransformPolyDataFilter.
 * @param {ITransformPolyDataFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ITransformPolyDataFilterInitialValues
): vtkTransformPolyDataFilter;

/**
 * vtkTransformPolyDataFilter is a filter to transform point coordinates and
 * associated point and cell normals and vectors. Other point and cell data is
 * passed through the filter unchanged. This filter is specialized for polygonal
 * data.
 */
export declare const vtkTransformPolyDataFilter: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkTransformPolyDataFilter;
