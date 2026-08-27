/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable, TypedArray } from '../../../types';
import vtkWebGPUDevice from '../Device';

export interface IWebGPUUniformBufferInitialValues {
  sizeInBytes?: number;
  label?: string;
  binding?: number;
  bindGroupLayoutEntry?: Partial<GPUBindGroupLayoutEntry>;
  device?: vtkWebGPUDevice;
}

/**
 * A uniform buffer holding a single WGSL struct. Entries are reordered to
 * satisfy the WGSL memory layout rules before the buffer is sent.
 */
export interface vtkWebGPUUniformBuffer extends vtkObject {
  /**
   * Append an entry to the struct.
   * @param name The WGSL member name.
   * @param type The WGSL type, e.g. 'vec4<f32>'.
   */
  addEntry(name: string, type: string): void;

  /**
   * Reorder and pack the entries if they changed since the last sort, and
   * recompute the size of the struct.
   */
  sortBufferEntries(): void;

  /**
   * Create the GPU buffer if needed and write the contents when they changed.
   * @param device The device to send the data to.
   */
  sendIfNeeded(device: vtkWebGPUDevice): void;

  /**
   * Make sure a typed array view of the given type exists over the backing
   * array buffer.
   * @param type The typed array constructor name, e.g. 'Float32Array'.
   */
  createView(type: string): void;

  /**
   * Set a scalar entry.
   * @param name The entry name.
   * @param val The value to store.
   */
  setValue(name: string, val: number): void;

  /**
   * Set a vector or matrix entry.
   * @param name The entry name.
   * @param arr The values to store.
   */
  setArray(name: string, arr: number[] | TypedArray): void;

  /**
   * Get the bind group entry for this buffer, creating the GPU buffer if
   * needed. The binding index is filled in by the bind group.
   */
  getBindGroupEntry(): Omit<GPUBindGroupEntry, 'binding'>;

  /**
   * Get the time of the last sendIfNeeded call.
   */
  getSendTime(): number;

  /**
   * Get the WGSL declaration of this uniform buffer.
   * @param binding The binding index.
   * @param group The bind group index.
   */
  getShaderCode(binding: number, group: number): string;

  /**
   * Release the GPU buffer, forcing it to be recreated and resent on the next
   * sendIfNeeded call.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the binding index.
   */
  getBinding(): number;

  /**
   * Get the object whose modified time changes when the bind group entry
   * becomes stale.
   */
  getBindGroupTime(): vtkObject;

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
   * Get the device the buffer was last sent to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the buffer belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  /**
   * Get the WGSL name of the uniform buffer.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the WGSL name of the uniform buffer.
   */
  setLabel(label: string): boolean;

  /**
   * Get the size of the struct in bytes.
   */
  getSizeInBytes(): number;

  /**
   * Set the size of the struct in bytes.
   */
  setSizeInBytes(sizeInBytes: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUUniformBuffer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUUniformBufferInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUUniformBufferInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUUniformBuffer.
 * @param {IWebGPUUniformBufferInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUUniformBufferInitialValues
): vtkWebGPUUniformBuffer;

export declare const vtkWebGPUUniformBuffer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUUniformBuffer;
