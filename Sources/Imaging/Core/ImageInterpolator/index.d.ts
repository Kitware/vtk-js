import { Extent, Nullable, TypedArray, Vector3, Vector4 } from '../../../types';
import {
  IAbstractImageInterpolatorInitialValues,
  IInterpolationInfo,
  IInterpolationWeights,
  vtkAbstractImageInterpolator,
} from '../AbstractImageInterpolator';
import { InterpolationMode } from '../AbstractImageInterpolator/Constants';

/**
 *
 */
export interface IImageInterpolatorInitialValues extends IAbstractImageInterpolatorInitialValues {
  interpolationMode?: InterpolationMode;
}

export interface vtkImageInterpolator extends vtkAbstractImageInterpolator {
  /**
   * Size of the interpolation kernel along each axis: 1 for nearest, 2 for
   * linear and 4 for cubic. When `matrix` describes an integer mapping along
   * an axis, that axis needs no interpolation and gets a size of 1.
   * @param matrix Optional 4x4 row-major matrix, or null.
   */
  computeSupportSize(matrix: Nullable<number[]>): Vector3;

  /**
   *
   */
  isSeparable(): boolean;

  /**
   * Nearest-neighbor interpolation kernel.
   */
  interpolateNearest(
    interpolationInfo: IInterpolationInfo,
    point: Vector3,
    value: number[] | TypedArray
  ): void;

  /**
   * Trilinear interpolation kernel.
   */
  interpolateLinear(
    interpolationInfo: IInterpolationInfo,
    point: Vector3,
    value: number[] | TypedArray
  ): void;

  /**
   * Nearest-neighbor row kernel.
   */
  interpolateRowNearest(
    weights: IInterpolationWeights,
    idX: number,
    idY: number,
    idZ: number,
    outPtr: number[] | TypedArray,
    n: number
  ): void;

  /**
   * Trilinear row kernel.
   */
  interpolateRowLinear(
    weights: IInterpolationWeights,
    idX: number,
    idY: number,
    idZ: number,
    outPtr: number[] | TypedArray,
    n: number
  ): void;

  /**
   * Cubic interpolation weights for a fractional position.
   */
  vtkTricubicInterpWeights(f: number): Vector4;

  /**
   * Precompute the per-axis positions and weights needed to resample the
   * given output extent, and report the portion of it that lies inside the
   * input data in `clipExt`.
   * @param matrix 4x4 row-major matrix mapping output to input indices.
   * @param {Extent} outExt The output extent.
   * @param {Extent} clipExt Filled with the clipped output extent.
   */
  precomputeWeightsForExtent(
    matrix: number[],
    outExt: Extent,
    clipExt: Extent
  ): void;

  /**
   *
   */
  getInterpolationMode(): InterpolationMode;

  /**
   *
   * @param {InterpolationMode} interpolationMode
   */
  setInterpolationMode(interpolationMode: InterpolationMode): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageInterpolator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageInterpolatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageInterpolatorInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageInterpolator
 * @param {IImageInterpolatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageInterpolatorInitialValues
): vtkImageInterpolator;

/**
 * vtkImageInterpolator provides nearest-neighbor and trilinear interpolation of
 * vtkImageData. The cubic mode declared by `InterpolationMode` is not
 * implemented.
 */
export declare const vtkImageInterpolator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageInterpolator;
