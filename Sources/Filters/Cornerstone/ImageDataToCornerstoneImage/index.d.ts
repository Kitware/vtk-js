import { vtkAlgorithm, vtkObject } from '../../../interfaces';
import { TypedArray } from '../../../types';

/**
 *
 */
export interface IImageDataToCornerstoneImageInitialValues {
  imageId?: string;
  sliceIndex?: number;
}

/**
 * The image object handed to cornerstone, as produced by this filter.
 */
export interface ICornerstoneImage {
  imageId: string;
  color: boolean;
  columnPixelSpacing: number;
  columns: number;
  width: number;
  rowPixelSpacing: number;
  rows: number;
  height: number;
  intercept: number;
  invert: boolean;
  minPixelValue: number;
  maxPixelValue: number;
  sizeInBytes: number;
  slope: number;
  windowCenter: number;
  windowWidth: number;
  decodeTimeInMS: number;
  getPixelData(): TypedArray;
}

type vtkImageDataToCornerstoneImageBase = vtkObject & vtkAlgorithm;

export interface vtkImageDataToCornerstoneImage extends vtkImageDataToCornerstoneImageBase {
  /**
   * Get the image id set on the produced cornerstone image.
   */
  getImageId(): string;

  /**
   * Get the index of the slice to extract from the input image data.
   */
  getSliceIndex(): number;

  /**
   * Convert the input vtkImageData slice into a cornerstone image.
   * @param inData
   * @param outData
   */
  requestData(inData: any, outData: any): void;

  /**
   * Set the image id of the produced cornerstone image.
   * @param {String} imageId
   */
  setImageId(imageId: string): boolean;

  /**
   * Set the index of the slice to extract from the input image data.
   * @param {Number} sliceIndex
   */
  setSliceIndex(sliceIndex: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageDataToCornerstoneImage characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageDataToCornerstoneImageInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IImageDataToCornerstoneImageInitialValues
): void;

/**
 * Method used to create a new instance of vtkImageDataToCornerstoneImage.
 * @param {IImageDataToCornerstoneImageInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IImageDataToCornerstoneImageInitialValues
): vtkImageDataToCornerstoneImage;

/**
 * vtkImageDataToCornerstoneImage converts a slice of a vtkImageData into an
 * image object that can be displayed by cornerstone.
 */
export declare const vtkImageDataToCornerstoneImage: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkImageDataToCornerstoneImage;
