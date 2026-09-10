import { vtkAlgorithm, vtkObject } from '../../../interfaces';

/**
 * Initial values for vtkImageAppend.
 */
export interface IImageAppendInitialValues {
  /**
   * The axis along which inputs are appended when preserveExtents is false.
   * 0 = X, 1 = Y, 2 = Z.
   * Default is 0.
   */
  appendAxis?: number;

  /**
   * Whether to preserve each input's native extent instead of shifting
   * inputs to sit back-to-back along appendAxis.
   * Default is false.
   */
  preserveExtents?: boolean;
}

type vtkImageAppendBase = vtkObject & vtkAlgorithm;

export interface vtkImageAppend extends vtkImageAppendBase {
  /**
   * Get the axis along which inputs are appended.
   * Only used when preserveExtents is false.
   */
  getAppendAxis(): number;

  /**
   * Get whether each input's native extent is preserved.
   *
   * If false (default), inputs are shifted so that they sit back-to-back
   * along appendAxis, in the order they were added, ignoring each input's
   * original extent along that axis.
   *
   * If true, every input keeps its own native extent. The output extent
   * becomes the union (bounding box) of all input extents, and any output
   * region not covered by an input is left zero-filled.
   */
  getPreserveExtents(): boolean;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the axis along which inputs are appended.
   * Only used when preserveExtents is false.
   * Initial value is 0.
   * @param {Number} appendAxis The appendAxis value (0 = X, 1 = Y, 2 = Z).
   */
  setAppendAxis(appendAxis: number): boolean;

  /**
   * Set whether each input's native extent is preserved instead of
   * shifting inputs to sit back-to-back along appendAxis.
   * Initial value is false.
   * @param {Boolean} preserveExtents The preserveExtents value.
   */
  setPreserveExtents(preserveExtents: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageAppend characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageAppendInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageAppendInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageAppend.
 * @param {IImageAppendInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageAppendInitialValues
): vtkImageAppend;

/**
 * vtkImageAppend appends one or more images into a single image, along a
 * chosen axis.
 *
 * When preserveExtents is false (default), inputs are stacked back-to-back
 * along appendAxis. When preserveExtents is true, each input keeps its own
 * native extent and the output becomes the union of all input extents,
 * leaving any uncovered region zero-filled.
 */
export declare const vtkImageAppend: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageAppend;
