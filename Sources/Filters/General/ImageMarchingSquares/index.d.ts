import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { TypedArray, Vector3 } from '../../../types';

/**
 * Converts an i-j-k index into world coordinates, writing them into `out`.
 */
export type IndexToWorld = (ijk: number[], out: number[]) => number[];

/**
 *
 */
export interface IImageMarchingSquaresInitialValues {
  contourValues?: number[];
  slicingMode?: number;
  slice?: number;
  mergePoints?: boolean;
}

type vtkImageMarchingSquaresBase = vtkObject & vtkAlgorithm;

export interface vtkImageMarchingSquares extends vtkImageMarchingSquaresBase {
  /**
   * Get the list of contour values.
   */
  getContourValues(): number[];

  /**
   * Get whether points shared by neighboring pixels are merged.
   */
  getMergePoints(): boolean;

  /**
   * Cache the world coordinates of the four corners of the pixel whose origin
   * is `ijk`.
   * @param {Vector3} ijk origin of the pixel
   * @param {Number} kernelX index of the X element
   * @param {Number} kernelY index of the Y element
   * @param {IndexToWorld} indexToWorld
   */
  getPixelPoints(
    ijk: Vector3,
    kernelX: number,
    kernelY: number,
    indexToWorld: IndexToWorld
  ): void;

  /**
   * Cache the point ids and the scalar values of the four corners of the pixel
   * whose origin is `ijk`.
   * @param {Vector3} ijk origin of the pixel
   * @param {Vector3} dims dimensions of the image
   * @param {TypedArray|Number[]} scalars
   * @param {Vector3} increments IJK slice increments
   * @param {Number} kernelX index of the X element
   * @param {Number} kernelY index of the Y element
   */
  getPixelScalars(
    ijk: Vector3,
    dims: Vector3,
    scalars: TypedArray | number[],
    increments: Vector3,
    kernelX: number,
    kernelY: number
  ): void;

  /**
   * Get the index of the axis along which the image is sliced.
   */
  getSlicingMode(): number;

  /**
   * Get the index of the slice the contours are extracted from.
   */
  getSlice(): number;

  /**
   * Append the line segments contributed by one pixel to `points` and `lines`.
   * @param {Number} cVal contour value
   * @param {Vector3} ijk origin of the pixel
   * @param {Vector3} dims dimensions of the image
   * @param {TypedArray|Number[]} scalars
   * @param {Number[]} points
   * @param {Number[]} lines
   * @param {Vector3} increments IJK slice increments
   * @param {Number} kernelX index of the X element
   * @param {Number} kernelY index of the Y element
   * @param {IndexToWorld} indexToWorld
   */
  produceLines(
    cVal: number,
    ijk: Vector3,
    dims: Vector3,
    scalars: TypedArray | number[],
    points: number[],
    lines: number[],
    increments: Vector3,
    kernelX: number,
    kernelY: number,
    indexToWorld: IndexToWorld
  ): void;

  /**
   *
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the list of contour values.
   * @param {Number[]} cValues
   */
  setContourValues(cValues: number[]): void;

  /**
   * Set whether points shared by neighboring pixels are merged.
   * @param {Boolean} mergePoints
   */
  setMergePoints(mergePoints: boolean): boolean;

  /**
   * Set the index of the slice the contours are extracted from.
   * @param {Number} slice
   */
  setSlice(slice: number): boolean;

  /**
   * Set the index of the axis along which the image is sliced (0: I, 1: J,
   * 2: K).
   * @param {Number} slicingMode
   */
  setSlicingMode(slicingMode: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageMarchingSquares characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageMarchingSquaresInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageMarchingSquaresInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageMarchingSquares
 * @param {IImageMarchingSquaresInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageMarchingSquaresInitialValues
): vtkImageMarchingSquares;

/**
 * vtkImageMarchingSquares - generate isolines from one slice of a vtkImageData
 *
 * vtkImageMarchingSquares is a filter that takes a vtkImageData as input and
 * generates, using the marching squares case table, a vtkPolyData containing
 * one polyline per contour value on the selected slice.
 */
export declare const vtkImageMarchingSquares: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageMarchingSquares;
