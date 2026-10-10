import { vtkObject } from '../../../interfaces';
import { Extent, Nullable, TypedArray, Vector3 } from '../../../types';
import vtkImageData from '../../../Common/DataModel/ImageData';
import { ImageBorderMode, InterpolationMode } from './Constants';

/**
 * Description of the scalars being interpolated, shared with the
 * interpolation kernels.
 */
export interface IInterpolationInfo {
  pointer: Nullable<TypedArray>;
  extent: Extent;
  increments: Vector3;
  scalarType: Nullable<string>;
  dataTypeSize: number;
  numberOfComponents: number;
  borderMode: ImageBorderMode;
  interpolationMode: InterpolationMode;
  extraInfo: any;
}

/**
 * Precomputed per-axis interpolation weights for a whole extent.
 */
export interface IInterpolationWeights extends IInterpolationInfo {
  positions: any[];
  weights: Nullable<any[]>;
  weightExtent: Extent;
  kernelSize: Vector3;
  workspace: Nullable<TypedArray>;
  lastY: Nullable<number>;
  lastZ: Nullable<number>;
}

/**
 *
 */
export interface IAbstractImageInterpolatorInitialValues {
  outValue?: number;
  tolerance?: number;
  componentOffset?: number;
  componentCount?: number;
  borderMode?: ImageBorderMode;
  slidingWindow?: boolean;
}

export interface vtkAbstractImageInterpolator extends vtkObject {
  /**
   * Setup the interpolator for the given image: caches its scalars, spacing,
   * origin and extent then calls `update()`.
   * @param {vtkImageData} data The image to interpolate.
   */
  initialize(data: vtkImageData): void;

  /**
   * Drop the reference to the scalars that were set by `initialize()`.
   */
  releaseData(): void;

  /**
   * Recompute the structured bounds and the interpolation info from the
   * current scalars. Must be called after any option is changed.
   */
  update(): void;

  /**
   * Hook called at the end of `update()` for subclasses to update their own
   * state. Does nothing on the abstract class.
   */
  internalUpdate(): void;

  /**
   * Interpolate a single component at the given world position. Returns
   * `outValue` when the position is outside of the structured bounds.
   */
  interpolateXYZ(x: number, y: number, z: number, component: number): number;

  /**
   * Interpolate all components at the given world position into `value`.
   * Returns false and fills `value` with `outValue` when the position is
   * outside of the structured bounds.
   * @param {Vector3} point The world coordinate.
   * @param value Output array, filled with the interpolated components.
   */
  interpolate(point: Vector3, value: number[] | TypedArray): boolean;

  /**
   * Number of components that will be interpolated given an input component
   * count, taking `componentOffset` and `componentCount` into account.
   */
  computeNumberOfComponents(inputCount: number): number;

  /**
   *
   */
  getNumberOfComponents(): number;

  /**
   * Interpolate at the given structured (index space) coordinate.
   * @param {Vector3} point The structured coordinate.
   * @param value Output array, filled with the interpolated components.
   */
  interpolateIJK(point: Vector3, value: number[] | TypedArray): void;

  /**
   * Check whether a structured coordinate lies within the structured bounds.
   * @param {Vector3} point The structured coordinate.
   */
  checkBoundsIJK(point: Vector3): boolean;

  /**
   * Size of the interpolation kernel along each axis. `null` on the abstract
   * class, subclasses provide the implementation.
   */
  computeSupportSize: Nullable<(matrix: Nullable<number[]>) => Vector3>;

  /**
   * Whether the interpolation kernel is separable. `null` on the abstract
   * class, subclasses provide the implementation.
   */
  isSeparable: Nullable<() => boolean>;

  /**
   *
   */
  precomputeWeightsForExtent(
    matrix: number[],
    inExtent: Extent,
    checkExtent: Extent
  ): void;

  /**
   *
   */
  FreePrecomputedWeights(weights: IInterpolationWeights): void;

  /**
   * Interpolation kernel. Does nothing on the abstract class.
   */
  interpolatePoint(
    interpolationInfo: IInterpolationInfo,
    point: Vector3,
    value: number[] | TypedArray
  ): void;

  /**
   * Row interpolation kernel. Does nothing on the abstract class.
   */
  interpolateRow(
    weights: IInterpolationWeights,
    xIdx: number,
    yIdx: number,
    zIdx: number,
    value: number[] | TypedArray,
    n: number
  ): void;

  /**
   * Origin of the image passed to `initialize()`.
   */
  getOrigin(): Nullable<Vector3>;

  /**
   * Spacing of the image passed to `initialize()`.
   */
  getSpacing(): Nullable<Vector3>;

  /**
   *
   */
  getOutValue(): number;

  /**
   * Value returned for positions that lie outside of the image.
   * @param {Number} outValue
   */
  setOutValue(outValue: number): boolean;

  /**
   *
   */
  getTolerance(): number;

  /**
   * Tolerance, in structured coordinates, by which the image bounds are
   * enlarged when checking whether a position can be interpolated.
   * @param {Number} tolerance
   */
  setTolerance(tolerance: number): boolean;

  /**
   *
   */
  getComponentOffset(): number;

  /**
   * Index of the first scalar component to interpolate.
   * @param {Number} componentOffset
   */
  setComponentOffset(componentOffset: number): boolean;

  /**
   *
   */
  getComponentCount(): number;

  /**
   * Number of scalar components to interpolate, starting at
   * `componentOffset`. A value of -1 means all remaining components.
   * @param {Number} componentCount
   */
  setComponentCount(componentCount: number): boolean;

  /**
   *
   */
  getBorderMode(): ImageBorderMode;

  /**
   * How out-of-extent indices are mapped back into the extent.
   * @param {ImageBorderMode} borderMode
   */
  setBorderMode(borderMode: ImageBorderMode): boolean;

  /**
   *
   */
  getSlidingWindow(): boolean;

  /**
   *
   * @param {Boolean} slidingWindow
   */
  setSlidingWindow(slidingWindow: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAbstractImageInterpolator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAbstractImageInterpolatorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAbstractImageInterpolatorInitialValues
): void;

/**
 * Method used to create a new instance of vtkAbstractImageInterpolator
 * @param {IAbstractImageInterpolatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAbstractImageInterpolatorInitialValues
): vtkAbstractImageInterpolator;

/**
 * vtkAbstractImageInterpolator provides an abstract interface for interpolating
 * image data. The `initialize()` method takes a vtkImageData as input and
 * caches everything the interpolation kernels need; subclasses supply the
 * kernels themselves through `interpolatePoint()` and `interpolateRow()`.
 */
export declare const vtkAbstractImageInterpolator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  ImageBorderMode: typeof ImageBorderMode;
  InterpolationMode: typeof InterpolationMode;
};
export default vtkAbstractImageInterpolator;
