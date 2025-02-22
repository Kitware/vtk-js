import { vtkAlgorithm, vtkObject } from '../../../interfaces';

export interface ThresholdCriteria {
  arrayName: string;
  fieldAssociation: string;
  operation: string;
  value: number;
}

/**
 *
 */
export interface IThresholdPointsInitialValues {
  criterias?: ThresholdCriteria[];
}

type vtkThresholdPointsBase = vtkObject & vtkAlgorithm;

export interface vtkThresholdPoints extends vtkThresholdPointsBase {
  /**
   * Get the desired precision for the output types.
   */
  getCriterias(): ThresholdCriteria[];

  /**
   * Set the desired precision for the output types.
   * @param outputPointsPrecision
   */
  setCriterias(criterias: ThresholdCriteria[]): boolean;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkThresholdPoints characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IThresholdPointsInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IThresholdPointsInitialValues
): void;

/**
 * Method used to create a new instance of vtkThresholdPoints
 * @param {IThresholdPointsInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IThresholdPointsInitialValues
): vtkThresholdPoints;

/**
 * vtkThresholdPoints - extracts points whose scalar value satisfies threshold criterion
 *
 * vtkThresholdPoints is a filter that extracts points from a dataset that
 * satisfy a threshold criterion. The criterion can take three forms:
 * 1) greater than a particular value; 2) less than a particular value; or
 * 3) between a particular value. The output of the filter is polygonal data.
 */
export declare const vtkThresholdPoints: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkThresholdPoints;
