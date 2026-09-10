import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 * Initial values for vtkImageAppendComponents.
 */
export interface IImageAppendComponentsInitialValues {}

type vtkImageAppendComponentsBase = vtkObject & vtkAlgorithm;

export interface vtkImageAppendComponents extends vtkImageAppendComponentsBase {
  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageAppendComponents characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageAppendComponentsInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageAppendComponentsInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageAppendComponents.
 * @param {IImageAppendInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageAppendComponentsInitialValues
): vtkImageAppendComponents;

/**
 * vtkImageAppendComponents appends the components of one or more images
 * into a single image.
 *
 */
export declare const vtkImageAppendComponents: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageAppendComponents;
