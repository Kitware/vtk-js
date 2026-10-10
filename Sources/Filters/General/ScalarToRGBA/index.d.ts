import vtkPiecewiseFunction from '../../../Common/DataModel/PiecewiseFunction';
import vtkScalarsToColors from '../../../Common/Core/ScalarsToColors';
import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 *
 */
export interface IScalarToRGBAInitialValues {
  lookupTable?: vtkScalarsToColors;
  piecewiseFunction?: vtkPiecewiseFunction;
}

type vtkScalarToRGBABase = vtkObject & vtkAlgorithm;

export interface vtkScalarToRGBA extends vtkScalarToRGBABase {
  /**
   * Get the lookup table mapping the input scalars to RGB.
   */
  getLookupTable(): Nullable<vtkScalarsToColors>;

  /**
   * Get the transfer function mapping the input scalars to opacity.
   */
  getPiecewiseFunction(): Nullable<vtkPiecewiseFunction>;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the lookup table mapping the input scalars to RGB.
   * @param {vtkScalarsToColors} lookupTable
   */
  setLookupTable(lookupTable: vtkScalarsToColors): boolean;

  /**
   * Set the transfer function mapping the input scalars to opacity.
   * @param {vtkPiecewiseFunction} piecewiseFunction
   */
  setPiecewiseFunction(piecewiseFunction: vtkPiecewiseFunction): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkScalarToRGBA characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IScalarToRGBAInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IScalarToRGBAInitialValues
): void;

/**
 * Method used to create a new instance of vtkScalarToRGBA
 * @param {IScalarToRGBAInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IScalarToRGBAInitialValues
): vtkScalarToRGBA;

/**
 * vtkScalarToRGBA - map the scalars of an image to an RGBA image
 *
 * vtkScalarToRGBA converts the point scalars of the input vtkImageData into a
 * four-component unsigned char array, using the lookup table for the color and
 * the piecewise function for the alpha channel. The output vtkImageData keeps
 * the extent, spacing, origin and direction of the input.
 */
export declare const vtkScalarToRGBA: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkScalarToRGBA;
