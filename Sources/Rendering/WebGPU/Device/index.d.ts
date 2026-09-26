/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkWebGPUBufferManager from '../BufferManager';
import vtkWebGPUShaderCache from '../ShaderCache';
import vtkWebGPUShaderModule from '../ShaderModule';
import vtkWebGPUTextureManager from '../TextureManager';

/**
 * A map of key to weak reference. Entries whose value has been garbage
 * collected are dropped on the next lookup.
 */
export declare class WeakRefMap extends Map<string, unknown> {
  /**
   * Dereference the entry stored under the given key.
   */
  getValue(key: string): unknown;

  /**
   * Store a weak reference to the given value. Non objects are not stored.
   */
  setValue(key: string, value: unknown): unknown;
}

export interface IWebGPUDeviceInitialValues {
  handle?: GPUDevice;
  pipelines?: Record<string, unknown>;
  shaderCache?: unknown;
  bindGroupLayouts?: unknown[];
  bufferManager?: vtkWebGPUBufferManager;
  textureManager?: unknown;
}

export interface vtkWebGPUDevice extends vtkObject {
  /**
   * Set the GPUDevice this object wraps.
   * @param handle The WebGPU device.
   */
  initialize(handle: GPUDevice): void;

  /**
   * Create a new command encoder on the underlying device.
   */
  createCommandEncoder(): GPUCommandEncoder;

  /**
   * Finish the given command encoder and submit it to the device queue.
   * @param commandEncoder The encoder to finish and submit.
   */
  submitCommandEncoder(commandEncoder: GPUCommandEncoder): void;

  /**
   * Get a shader module from the shader cache for the given shader description.
   * @param sd The vtkWebGPUShaderDescription to compile.
   */
  getShaderModule(sd: any): vtkWebGPUShaderModule;

  /**
   * Get a bind group layout matching the given description, creating and
   * caching it when it is not already known. Missing binding and visibility
   * entries are filled in with defaults.
   * @param val The bind group layout descriptor.
   */
  getBindGroupLayout(
    val: GPUBindGroupLayoutDescriptor
  ): Nullable<GPUBindGroupLayout>;

  /**
   * Get the stringified descriptor a cached bind group layout was built from.
   * @param layout A layout previously returned by getBindGroupLayout.
   */
  getBindGroupLayoutDescription(layout: GPUBindGroupLayout): Nullable<string>;

  /**
   * Get a previously created pipeline by hash.
   * @param hash The pipeline hash.
   */
  getPipeline(hash: string): Nullable<any>;

  /**
   * Initialize the given pipeline and store it under the given hash.
   * @param hash The pipeline hash.
   * @param pipeline The vtkWebGPUPipeline to initialize.
   */
  createPipeline(hash: string, pipeline: any): void;

  /**
   * Resolves once all work submitted to the device queue has completed.
   */
  onSubmittedWorkDone(): Promise<void>;

  /**
   * Get the cached object stored under the given hash, if it is still alive.
   * @param hash The object hash.
   */
  hasCachedObject(hash: string): unknown;

  /**
   * Get the cached object stored under the given hash, creating and caching it
   * with the provided creator when it is missing.
   * @param hash The object hash.
   * @param creator Called with the remaining arguments when nothing is cached.
   * @param args Extra arguments forwarded to the creator.
   */
  getCachedObject<T>(
    hash: string,
    creator: (...args: any[]) => T,
    ...args: any[]
  ): Nullable<T>;

  /**
   * Get the GPUDevice this object wraps.
   */
  getHandle(): Nullable<GPUDevice>;

  /**
   * Set the GPUDevice this object wraps.
   */
  setHandle(handle: GPUDevice): boolean;

  /**
   * Get the buffer manager owned by this device.
   */
  getBufferManager(): vtkWebGPUBufferManager;

  /**
   * Get the shader cache owned by this device.
   */
  getShaderCache(): vtkWebGPUShaderCache;

  /**
   * Get the texture manager owned by this device.
   */
  getTextureManager(): vtkWebGPUTextureManager;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUDevice characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUDeviceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUDeviceInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUDevice.
 * @param {IWebGPUDeviceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUDeviceInitialValues
): vtkWebGPUDevice;

export declare const vtkWebGPUDevice: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUDevice;
