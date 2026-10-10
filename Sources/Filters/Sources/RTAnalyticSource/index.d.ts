import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { Extent, Matrix3x3, Vector3 } from '../../../types';

/**
 *
 */
export interface IRTAnalyticSourceInitialValues {
  offset?: number;
  maximum?: number;
  center?: Vector3;
  frequency?: Vector3;
  magnitude?: Vector3;
  standardDeviation?: number;
  wholeExtent?: Extent;
  dataDirection?: Matrix3x3;
}

type vtkRTAnalyticSourceBase = vtkObject &
  Omit<
    vtkAlgorithm,
    | 'getInputData'
    | 'setInputData'
    | 'setInputConnection'
    | 'getInputConnection'
    | 'addInputConnection'
    | 'addInputData'
  >;

export interface vtkRTAnalyticSource extends vtkRTAnalyticSourceBase {
  /**
   * Get the center of the gaussian, expressed in voxel index.
   * @default [0, 0, 0]
   */
  getCenter(): Vector3;

  /**
   * Get the center of the gaussian, expressed in voxel index.
   */
  getCenterByReference(): Vector3;

  /**
   * Get the direction matrix of the output image.
   * @default [1, 0, 0, 0, 1, 0, 0, 0, 1]
   */
  getDataDirection(): Matrix3x3;

  /**
   * Get the direction matrix of the output image.
   */
  getDataDirectionByReference(): Matrix3x3;

  /**
   * Get the natural frequency of the sinusoid along each axis.
   * @default [60, 30, 40]
   */
  getFrequency(): Vector3;

  /**
   * Get the natural frequency of the sinusoid along each axis.
   */
  getFrequencyByReference(): Vector3;

  /**
   * Get the amplitude of the sinusoid along each axis.
   * @default [10, 18, 5]
   */
  getMagnitude(): Vector3;

  /**
   * Get the amplitude of the sinusoid along each axis.
   */
  getMagnitudeByReference(): Vector3;

  /**
   * Get the maximum value of the gaussian.
   * @default 120
   */
  getMaximum(): number;

  /**
   * Get the constant value added to every voxel.
   * @default 40
   */
  getOffset(): number;

  /**
   * Get the standard deviation of the gaussian.
   * @default 0.5
   */
  getStandardDeviation(): number;

  /**
   * Get the extent of the output image.
   * @default [-10, 10, -10, 10, -10, 10]
   */
  getWholeExtent(): Extent;

  /**
   * Get the extent of the output image.
   */
  getWholeExtentByReference(): Extent;

  /**
   * Expose methods
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the center of the gaussian, expressed in voxel index.
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {Number} z The z coordinate.
   */
  setCenter(x: number, y: number, z: number): boolean;

  /**
   * Set the center of the gaussian, expressed in voxel index.
   * @param {Vector3} center
   */
  setCenter(center: Vector3): boolean;

  /**
   * Set the center of the gaussian, expressed in voxel index.
   * @param {Vector3} center
   */
  setCenterFrom(center: Vector3): void;

  /**
   * Set the direction matrix of the output image.
   * @param {Matrix3x3} dataDirection
   */
  setDataDirection(dataDirection: Matrix3x3): boolean;

  /**
   * Set the direction matrix of the output image.
   * @param {Number} e00
   * @param {Number} e01
   * @param {Number} e02
   * @param {Number} e10
   * @param {Number} e11
   * @param {Number} e12
   * @param {Number} e20
   * @param {Number} e21
   * @param {Number} e22
   */
  setDataDirection(
    e00: number,
    e01: number,
    e02: number,
    e10: number,
    e11: number,
    e12: number,
    e20: number,
    e21: number,
    e22: number
  ): boolean;

  /**
   * Set the direction matrix of the output image.
   * @param {Matrix3x3} dataDirection
   */
  setDataDirectionFrom(dataDirection: Matrix3x3): void;

  /**
   * Set the natural frequency of the sinusoid along each axis.
   * @param {Number} x The x frequency.
   * @param {Number} y The y frequency.
   * @param {Number} z The z frequency.
   */
  setFrequency(x: number, y: number, z: number): boolean;

  /**
   * Set the natural frequency of the sinusoid along each axis.
   * @param {Vector3} frequency
   */
  setFrequency(frequency: Vector3): boolean;

  /**
   * Set the natural frequency of the sinusoid along each axis.
   * @param {Vector3} frequency
   */
  setFrequencyFrom(frequency: Vector3): void;

  /**
   * Set the amplitude of the sinusoid along each axis.
   * @param {Number} x The x magnitude.
   * @param {Number} y The y magnitude.
   * @param {Number} z The z magnitude.
   */
  setMagnitude(x: number, y: number, z: number): boolean;

  /**
   * Set the amplitude of the sinusoid along each axis.
   * @param {Vector3} magnitude
   */
  setMagnitude(magnitude: Vector3): boolean;

  /**
   * Set the amplitude of the sinusoid along each axis.
   * @param {Vector3} magnitude
   */
  setMagnitudeFrom(magnitude: Vector3): void;

  /**
   * Set the maximum value of the gaussian.
   * @param {Number} maximum
   */
  setMaximum(maximum: number): boolean;

  /**
   * Set the constant value added to every voxel.
   * @param {Number} offset
   */
  setOffset(offset: number): boolean;

  /**
   * Set the standard deviation of the gaussian.
   * @param {Number} standardDeviation
   */
  setStandardDeviation(standardDeviation: number): boolean;

  /**
   * Set the extent of the output image.
   * @param {Extent} wholeExtent
   */
  setWholeExtent(wholeExtent: Extent): boolean;

  /**
   * Set the extent of the output image.
   * @param {Number} x1
   * @param {Number} x2
   * @param {Number} y1
   * @param {Number} y2
   * @param {Number} z1
   * @param {Number} z2
   */
  setWholeExtent(
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    z1: number,
    z2: number
  ): boolean;

  /**
   * Set the extent of the output image.
   * @param {Extent} wholeExtent
   */
  setWholeExtentFrom(wholeExtent: Extent): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRTAnalyticSource characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRTAnalyticSourceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IRTAnalyticSourceInitialValues
): void;

/**
 * Method used to create a new instance of vtkRTAnalyticSource.
 * @param {IRTAnalyticSourceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IRTAnalyticSourceInitialValues
): vtkRTAnalyticSource;

/**
 * vtkRTAnalyticSource creates an image for regression testing. The image is
 * filled with the sum of a gaussian centered on `center` and of a sinusoid
 * whose amplitude and natural frequency are given per axis, plus a constant
 * offset.
 *
 * @example
 * ```js
 * import vtkRTAnalyticSource from '@kitware/vtk.js/Filters/Sources/RTAnalyticSource';
 *
 * const source = vtkRTAnalyticSource.newInstance({
 *   wholeExtent: [0, 63, 0, 63, 0, 63],
 * });
 * const imageData = source.getOutputData();
 * ```
 */
export declare const vtkRTAnalyticSource: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkRTAnalyticSource;
