/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';
import vtkWebGPUDevice from '../Device';

export interface IWebGPUStorageBufferInitialValues {
  device?: vtkWebGPUDevice;
  bindGroupLayoutEntry?: Partial<GPUBindGroupLayoutEntry>;
  label?: string;
  numberOfInstances?: number;
  sizeInBytes?: number;
}

/**
 * A storage buffer holding one struct per instance. Unlike the uniform buffer
 * the entries are laid out in the order they are added, so the caller is
 * responsible for respecting the WGSL alignment rules.
 */
export interface vtkWebGPUStorageBuffer extends vtkObject {
  /**
   * Append an entry to the struct.
   * @param name The WGSL member name.
   * @param type The WGSL type, e.g. 'vec4<f32>'.
   */
  addEntry(name: string, type: string): void;

  /**
   * Create the GPU buffer if needed and write the current contents to it.
   * @param device The device to send the data to.
   */
  send(device: vtkWebGPUDevice): void;

  /**
   * Make sure a typed array view of the given type exists over the backing
   * array buffer.
   * @param type The typed array constructor name, e.g. 'Float32Array'.
   */
  createView(type: string): void;

  /**
   * Set a scalar entry for one instance.
   * @param name The entry name.
   * @param instance The instance index.
   * @param val The value to store.
   */
  setValue(name: string, instance: number, val: number): void;

  /**
   * Set a vector or matrix entry for one instance.
   * @param name The entry name.
   * @param instance The instance index.
   * @param arr The values to store.
   */
  setArray(name: string, instance: number, arr: number[] | TypedArray): void;

  /**
   * Set an entry for every instance from a single flat array.
   * @param name The entry name.
   * @param arr numberOfInstances contiguous blocks of values.
   */
  setAllInstancesFromArray(name: string, arr: number[] | TypedArray): void;

  /**
   * Set an entry for every instance from a single flat array of unsigned char
   * colors, dividing each component by 255.
   * @param name The entry name.
   * @param arr numberOfInstances contiguous blocks of values.
   */
  setAllInstancesFromArrayColorToFloat(
    name: string,
    arr: number[] | TypedArray
  ): void;

  /**
   * Set a mat4x4 entry for every instance from a flat array of 3x3 matrices.
   * @param name The entry name.
   * @param arr numberOfInstances blocks of nine values.
   */
  setAllInstancesFromArray3x3To4x4(
    name: string,
    arr: number[] | TypedArray
  ): void;

  /**
   * Get the time of the last send.
   */
  getSendTime(): number;

  /**
   * Get the WGSL declaration of this storage buffer.
   * @param binding The binding index.
   * @param group The bind group index.
   */
  getShaderCode(binding: number, group: number): string;

  /**
   * Get the bind group entry for this buffer, creating the GPU buffer if
   * needed. The binding index is filled in by the bind group.
   */
  getBindGroupEntry(): Omit<GPUBindGroupEntry, 'binding'>;

  /**
   * Drop every entry and the GPU buffer, leaving an empty storage buffer.
   */
  clearData(): void;

  /**
   * Release the GPU buffer, forcing it to be recreated on the next send.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the object whose modified time changes when the bind group entry
   * becomes stale.
   */
  getBindGroupTime(): vtkObject;

  /**
   * Get the device the buffer was last sent to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the buffer belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  /**
   * Get the bind group layout entry describing this buffer.
   */
  getBindGroupLayoutEntry(): Partial<GPUBindGroupLayoutEntry>;

  /**
   * Set the bind group layout entry describing this buffer.
   */
  setBindGroupLayoutEntry(
    bindGroupLayoutEntry: Partial<GPUBindGroupLayoutEntry>
  ): boolean;

  /**
   * Get the WGSL name of the storage buffer.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the WGSL name of the storage buffer.
   */
  setLabel(label: string): boolean;

  /**
   * Get the number of struct instances held by the buffer.
   */
  getNumberOfInstances(): number;

  /**
   * Set the number of struct instances held by the buffer.
   */
  setNumberOfInstances(numberOfInstances: number): boolean;

  /**
   * Get the size of a single struct instance in bytes.
   */
  getSizeInBytes(): number;

  /**
   * Set the size of a single struct instance in bytes.
   */
  setSizeInBytes(sizeInBytes: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUStorageBuffer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUStorageBufferInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUStorageBufferInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUStorageBuffer.
 * @param {IWebGPUStorageBufferInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUStorageBufferInitialValues
): vtkWebGPUStorageBuffer;

export declare const vtkWebGPUStorageBuffer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUStorageBuffer;
