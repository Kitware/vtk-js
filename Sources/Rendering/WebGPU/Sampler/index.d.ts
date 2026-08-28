/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkWebGPUDevice from '../Device';

export interface IWebGPUSamplerInitialValues {
  device?: vtkWebGPUDevice;
  handle?: GPUSampler;
  label?: string;
  options?: GPUSamplerDescriptor;
  bindGroupLayoutEntry?: Partial<GPUBindGroupLayoutEntry>;
}

export interface vtkWebGPUSampler extends vtkObject {
  /**
   * Create the GPUSampler. Any address mode or filter left out of the options
   * falls back to 'clamp-to-edge' and 'nearest' respectively.
   * @param device The device to create the sampler on.
   * @param {GPUSamplerDescriptor} [options] (default: {})
   */
  create(device: vtkWebGPUDevice, options?: GPUSamplerDescriptor): void;

  /**
   * Get the WGSL declaration of this sampler.
   * @param binding The binding index.
   * @param group The bind group index.
   */
  getShaderCode(binding: number, group: number): string;

  /**
   * Get the bind group entry for this sampler. The binding index is filled in
   * by the bind group.
   */
  getBindGroupEntry(): Omit<GPUBindGroupEntry, 'binding'>;

  /**
   * Get the object whose modified time changes when the sampler is created.
   */
  getBindGroupTime(): vtkObject;

  /**
   * Get the GPUSampler.
   */
  getHandle(): Nullable<GPUSampler>;

  /**
   * Get the descriptor the sampler was created with.
   */
  getOptions(): GPUSamplerDescriptor;

  /**
   * Get the bind group layout entry describing this sampler.
   */
  getBindGroupLayoutEntry(): Partial<GPUBindGroupLayoutEntry>;

  /**
   * Set the bind group layout entry describing this sampler.
   */
  setBindGroupLayoutEntry(
    bindGroupLayoutEntry: Partial<GPUBindGroupLayoutEntry>
  ): boolean;

  /**
   * Get the device the sampler belongs to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the sampler belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  /**
   * Get the WGSL name of the sampler.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the WGSL name of the sampler.
   */
  setLabel(label: string): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUSampler characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUSamplerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUSamplerInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUSampler.
 * @param {IWebGPUSamplerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUSamplerInitialValues
): vtkWebGPUSampler;

export declare const vtkWebGPUSampler: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUSampler;
