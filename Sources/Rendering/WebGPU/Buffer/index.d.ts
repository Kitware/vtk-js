/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';
import { BufferUsage, PrimitiveTypes } from '../BufferManager/Constants';
import vtkWebGPUDevice from '../Device';

/**
 * Description of a single vertex attribute stored inside a buffer.
 */
export interface IWebGPUBufferArrayInformation {
  offset?: number;
  format: string;
  interpolation?: string;
}

export interface IWebGPUBufferInitialValues {
  device?: vtkWebGPUDevice;
  handle?: GPUBuffer;
  sizeInBytes?: number;
  strideInBytes?: number;
  arrayInformation?: IWebGPUBufferArrayInformation[];
  usage?: GPUBufferUsageFlags;
  label?: string;
  sourceTime?: number;
}

export interface vtkWebGPUBuffer extends vtkObject {
  /**
   * Allocate the underlying GPU buffer without writing to it.
   * @param sizeInBytes The size of the buffer.
   * @param usage The GPUBufferUsage flags of the buffer.
   */
  create(sizeInBytes: number, usage: GPUBufferUsageFlags): void;

  /**
   * Copy data into the already created GPU buffer.
   * @param data The data to write, starting at offset zero.
   */
  write(data: TypedArray): void;

  /**
   * Allocate the GPU buffer, padded to a multiple of four bytes, and fill it.
   * @param data The data to write.
   * @param usage The GPUBufferUsage flags of the buffer.
   */
  createAndWrite(data: TypedArray, usage: GPUBufferUsageFlags): void;

  /**
   * Forwarded to the underlying GPUBuffer.
   */
  getMappedRange(offset?: number, size?: number): ArrayBuffer;

  /**
   * Forwarded to the underlying GPUBuffer.
   */
  mapAsync(
    mode: GPUMapModeFlags,
    offset?: number,
    size?: number
  ): Promise<void>;

  /**
   * Forwarded to the underlying GPUBuffer.
   */
  unmap(): void;

  /**
   * Get the underlying GPUBuffer.
   */
  getHandle(): Nullable<GPUBuffer>;

  /**
   * Get the size of the allocated buffer in bytes.
   */
  getSizeInBytes(): number;

  /**
   * Get the GPUBufferUsage flags the buffer was created with.
   */
  getUsage(): Nullable<GPUBufferUsageFlags>;

  /**
   * Get the stride, in bytes, between two consecutive vertices.
   */
  getStrideInBytes(): number;

  /**
   * Set the stride, in bytes, between two consecutive vertices.
   */
  setStrideInBytes(strideInBytes: number): boolean;

  /**
   * Get the device this buffer belongs to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this buffer belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  /**
   * Get the description of the attributes packed into this buffer.
   */
  getArrayInformation(): Nullable<IWebGPUBufferArrayInformation[]>;

  /**
   * Set the description of the attributes packed into this buffer.
   */
  setArrayInformation(
    arrayInformation: IWebGPUBufferArrayInformation[]
  ): boolean;

  /**
   * Get the label used when creating the GPUBuffer.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the label used when creating the GPUBuffer.
   */
  setLabel(label: string): boolean;

  /**
   * Get the modified time of the data this buffer was built from.
   */
  getSourceTime(): Nullable<number>;

  /**
   * Set the modified time of the data this buffer was built from.
   */
  setSourceTime(sourceTime: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUBuffer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUBufferInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUBufferInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUBuffer.
 * @param {IWebGPUBufferInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUBufferInitialValues
): vtkWebGPUBuffer;

export declare const vtkWebGPUBuffer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  BufferUsage: typeof BufferUsage;
  PrimitiveTypes: typeof PrimitiveTypes;
};
export default vtkWebGPUBuffer;
