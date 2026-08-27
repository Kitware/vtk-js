import { vtkObject } from '../../../interfaces';
import { Extent, Nullable, TypedArray, Vector3 } from '../../../types';
import vtkDataArray from '../../../Common/Core/DataArray';
import vtkImageData from '../../../Common/DataModel/ImageData';

/**
 *
 */
export interface IImagePointDataIteratorInitialValues {
  extent?: Extent;
}

export interface vtkImagePointDataIterator extends vtkObject {
  /**
   * Prepare the iterator to walk the given image over `inExtent`.
   * @param {vtkImageData} image The image to iterate over.
   * @param {Extent} [inExtent] The extent to walk, clamped to the image
   * extent. Defaults to the whole image extent when null.
   * @param stencil Optional stencil restricting the iteration.
   * @param algorithm Optional algorithm used for progress reporting.
   */
  initialize(
    image: vtkImageData,
    inExtent: Nullable<Extent>,
    stencil?: any,
    algorithm?: any
  ): void;

  /**
   * Move the iterator to the span containing the given x index of the current
   * row, and update the in-stencil state accordingly.
   * @param {Number} idX
   */
  setSpanState(idX: number): void;

  /**
   * Advance to the next span, row or slice.
   */
  nextSpan(): void;

  /**
   *
   */
  isAtEnd(): boolean;

  /**
   * Whether the current span lies inside the stencil. Always true when no
   * stencil was given to `initialize()`.
   */
  isInStencil(): boolean;

  /**
   * Point id just past the end of the current span.
   */
  spanEndId(): number;

  /**
   * Progress reporting hook. Does nothing by default.
   */
  reportProgress(): void;

  /**
   * Get the raw values of the given array, offset to tuple `i`.
   * @param {vtkDataArray} array
   * @param {Number} i The tuple index to start at.
   */
  getArray(array: vtkDataArray, i: number): TypedArray;

  /**
   * Get the raw scalars of the given image, offset to tuple `i`.
   * @param {vtkImageData} image
   * @param {Number} [i] The tuple index to start at (default 0).
   */
  getScalars(image: vtkImageData, i?: number): TypedArray;

  /**
   * Point id the iterator is currently at.
   */
  getId(): number;

  /**
   * Current x, y, z index.
   */
  getIndex(): Vector3;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImagePointDataIterator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImagePointDataIteratorInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImagePointDataIteratorInitialValues
): void;

/**
 * Method used to create a new instance of vtkImagePointDataIterator
 * @param {IImagePointDataIteratorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImagePointDataIteratorInitialValues
): vtkImagePointDataIterator;

/**
 * vtkImagePointDataIterator iterates over the point data of a vtkImageData,
 * one span at a time. A span is a contiguous run of points along the x axis
 * that is entirely inside or entirely outside of an optional stencil.
 */
export declare const vtkImagePointDataIterator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImagePointDataIterator;
