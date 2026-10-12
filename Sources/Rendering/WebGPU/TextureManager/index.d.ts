/// <reference types="@webgpu/types" />

import vtkImageData from '../../../Common/DataModel/ImageData';
import { vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';
import vtkTexture from '../../Core/Texture';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUTexture from '../Texture';

/**
 * A texture creation request. The source fields are filled in by the manager
 * from the vtkImageData or image source of the request, and `hash` keys the
 * device object cache.
 */
export interface IWebGPUTextureRequest {
  /**
   * The cache key. When absent the texture is created without being cached.
   */
  hash?: string;

  /**
   * The modified time the hash is derived from.
   */
  time?: number;

  /**
   * The WGSL name given to the created texture.
   */
  label?: string;

  imageData?: vtkImageData;
  dataArray?: unknown;
  image?: HTMLImageElement;
  jsImageData?: ImageData;
  imageBitmap?: ImageBitmap;
  canvas?: HTMLCanvasElement;
  nativeArray?: TypedArray;
  width?: number;
  height?: number;
  depth?: number;
  format?: GPUTextureFormat;
  usage?: GPUTextureUsageFlags;
  mipLevel?: number;
  flip?: boolean;
}

export interface IWebGPUTextureManagerInitialValues {
  handle?: unknown;
  device?: vtkWebGPUDevice;
}

export interface vtkWebGPUTextureManager extends vtkObject {
  /**
   * Get the texture matching the request from the device cache, creating and
   * caching it when it is missing. A request without a hash always creates a
   * new texture.
   * @param {IWebGPUTextureRequest} req The texture request.
   */
  getTexture(req: IWebGPUTextureRequest): Nullable<vtkWebGPUTexture>;

  /**
   * Get the texture holding the point scalars of the given image data. The
   * cache key covers both the image data and its scalar array modified times.
   * @param imgData The image data to upload.
   */
  getTextureForImageData(imgData: vtkImageData): Nullable<vtkWebGPUTexture>;

  /**
   * Get the texture holding the contents of a vtkTexture, whichever of its
   * image data, image, ImageData, ImageBitmap or canvas source is set.
   * @param srcTexture The texture to upload.
   * @param {String} [label] The WGSL name given to the created texture.
   */
  getTextureForVTKTexture(
    srcTexture: vtkTexture,
    label?: string
  ): Nullable<vtkWebGPUTexture>;

  /**
   * Get the device the textures are created on.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the textures are created on.
   */
  setDevice(device: vtkWebGPUDevice): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUTextureManager characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUTextureManagerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUTextureManagerInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUTextureManager.
 * @param {IWebGPUTextureManagerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUTextureManagerInitialValues
): vtkWebGPUTextureManager;

export declare const vtkWebGPUTextureManager: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUTextureManager;
