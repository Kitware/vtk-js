/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUTextureView from '../TextureView';

/**
 * The extent, format and usage a texture is allocated with.
 */
export interface IWebGPUTextureCreateOptions {
  width: number;
  height: number;

  /**
   * Defaults to 1.
   */
  depth?: number;

  /**
   * Defaults to '2d' for a single slice and '3d' otherwise.
   */
  dimension?: GPUTextureDimension;

  /**
   * Defaults to 'rgba8unorm'.
   */
  format?: GPUTextureFormat;

  /**
   * The highest mip level to allocate. Defaults to 0, a single level.
   */
  mipLevel?: number;

  /**
   * Defaults to TEXTURE_BINDING | COPY_DST.
   */
  usage?: GPUTextureUsageFlags;
}

/**
 * A texture upload. Exactly one of the source fields is used, in the order
 * canvas, imageBitmap, jsImageData, image, nativeArray. The image sources
 * overwrite the width, height, depth, format and flip fields of the request.
 */
export interface IWebGPUTextureImageRequest {
  canvas?: HTMLCanvasElement;
  imageBitmap?: ImageBitmap;
  jsImageData?: ImageData;
  image?: HTMLImageElement;
  nativeArray?: TypedArray;
  width?: number;
  height?: number;
  depth?: number;

  /**
   * The first slice written to. Defaults to 0.
   */
  originZ?: number;
  flip?: boolean;
  format?: GPUTextureFormat;
}

/**
 * An upload into a sub region of an existing texture. Only nativeArray data
 * is supported, and the region must lie within the texture extent.
 */
export interface IWebGPUTextureSubImageRequest {
  nativeArray?: TypedArray;

  /**
   * The origin of the written region. Each defaults to 0.
   */
  x?: number;
  y?: number;
  z?: number;

  /**
   * The size of the written region. Each defaults to the rest of the texture.
   */
  width?: number;
  height?: number;
  depth?: number;
}

export interface IWebGPUTextureInitialValues {
  _device?: vtkWebGPUDevice;
  dimension?: GPUTextureDimension;
  handle?: GPUTexture;
  buffer?: unknown;
  ready?: boolean;
  label?: string;
  width?: number;
  height?: number;
  depth?: number;
  format?: GPUTextureFormat;
  usage?: GPUTextureUsageFlags;
  mipLevel?: number;
}

export interface vtkWebGPUTexture extends vtkObject {
  /**
   * Allocate the GPUTexture.
   * @param device The device to allocate on.
   * @param {IWebGPUTextureCreateOptions} options The extent, format and usage.
   */
  create(device: vtkWebGPUDevice, options: IWebGPUTextureCreateOptions): void;

  /**
   * Wrap a GPUTexture this object does not own.
   * @param device The device the texture belongs to.
   * @param handle The texture to wrap.
   * @param {IWebGPUTextureCreateOptions} options The extent and format of the
   * given texture.
   */
  assignFromHandle(
    device: vtkWebGPUDevice,
    handle: GPUTexture,
    options: IWebGPUTextureCreateOptions
  ): void;

  /**
   * Upload a full image into the texture, repacking and half float converting
   * the data as the format requires, and regenerating the mipmaps of a 2d
   * texture that has them.
   * @param {IWebGPUTextureImageRequest} req The upload.
   */
  writeImageData(req: IWebGPUTextureImageRequest): void;

  /**
   * Upload into a sub region of the texture.
   * @param {IWebGPUTextureSubImageRequest} req The upload.
   */
  writeSubImageData(req: IWebGPUTextureSubImageRequest): void;

  /**
   * The factor a value read back from this texture must be multiplied by to
   * recover the original source value. 1.0 for the half float formats and
   * 255.0 for the normalized byte formats.
   */
  getScale(): number;

  /**
   * The number of components a texel of this texture's format holds.
   */
  getNumberOfComponents(): number;

  /**
   * The number of extents larger than one texel.
   */
  getDimensionality(): number;

  /**
   * Reallocate the texture when its extent differs from the given texture's.
   * @param tex The texture to match.
   */
  resizeToMatch(tex: vtkWebGPUTexture): void;

  /**
   * Reallocate the texture when the given extent differs from the current one.
   * @param width
   * @param height
   * @param {Number} [depth] (default: 1)
   */
  resize(width: number, height: number, depth?: number): void;

  /**
   * Create a view of this texture. A missing view dimension is derived from
   * the texture dimension and depth.
   * @param label The WGSL name of the view.
   * @param {GPUTextureViewDescriptor} [options] (default: {})
   */
  createView(
    label: string,
    options?: GPUTextureViewDescriptor
  ): vtkWebGPUTextureView;

  /**
   * Get the dimension the texture was allocated with.
   */
  getDimension(): GPUTextureDimension;

  /**
   * Get the GPUTexture.
   */
  getHandle(): Nullable<GPUTexture>;

  /**
   * Whether image data has been uploaded into the texture.
   */
  getReady(): boolean;

  getWidth(): number;

  getHeight(): number;

  getDepth(): number;

  /**
   * Get the format the texture was allocated with.
   */
  getFormat(): GPUTextureFormat;

  /**
   * Get the usage flags the texture was allocated with.
   */
  getUsage(): GPUTextureUsageFlags;

  /**
   * Get the device the texture belongs to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the texture belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  /**
   * Get the debug label of the texture.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the debug label of the texture.
   */
  setLabel(label: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUTexture characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUTextureInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUTextureInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUTexture.
 * @param {IWebGPUTextureInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUTextureInitialValues
): vtkWebGPUTexture;

export declare const vtkWebGPUTexture: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUTexture;
