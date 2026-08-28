/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkWebGPUDevice from '../Device';

/**
 * What a bind group requires of the objects it binds, such as uniform
 * buffers, storage buffers, texture views and samplers.
 */
export interface IWebGPUBindable {
  setDevice?(device: vtkWebGPUDevice): boolean | void;
  getBindGroupLayoutEntry(): Partial<GPUBindGroupLayoutEntry>;
  getBindGroupEntry(): Omit<GPUBindGroupEntry, 'binding'>;
  getBindGroupTime(): vtkObject;
  getShaderCode(binding: number, group: number): string;
}

export interface IWebGPUBindGroupInitialValues {
  device?: vtkWebGPUDevice;
  handle?: unknown;
  bindGroupDevice?: vtkWebGPUDevice;
  label?: string;
}

export interface vtkWebGPUBindGroup extends vtkObject {
  /**
   * Set the objects bound by this group, in binding order. The object is only
   * modified when the list actually changed.
   * @param bindables The objects to bind.
   */
  setBindables(bindables: IWebGPUBindable[]): void;

  /**
   * Get the bind group layout of the current bindables from the device cache.
   * @param device The device to create the layout on.
   */
  getBindGroupLayout(device: vtkWebGPUDevice): Nullable<GPUBindGroupLayout>;

  /**
   * Get the bind group, recreating it when the device or any bindable
   * changed since the last call.
   * @param device The device to create the bind group on.
   */
  getBindGroup(device: vtkWebGPUDevice): GPUBindGroup;

  /**
   * Get the WGSL declarations of every bindable, using the group index this
   * bind group has in the given pipeline.
   * @param pipeline The vtkWebGPUPipeline the shader code is built for.
   */
  getShaderCode(pipeline: any): string;

  /**
   * Drop the bind group so that it is recreated on the next getBindGroup.
   */
  releaseGraphicsResources(): void;

  /**
   * Get the object whose modified time changes when the bind group is
   * recreated.
   */
  getBindGroupTime(): vtkObject;

  getHandle(): unknown;

  getSizeInBytes(): number;

  getUsage(): unknown;

  /**
   * Get the WGSL name of the bind group.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the WGSL name of the bind group.
   */
  setLabel(label: string): boolean;

  /**
   * Get the device this bind group belongs to.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this bind group belongs to.
   */
  setDevice(device: vtkWebGPUDevice): boolean;

  getArrayInformation(): unknown;

  setArrayInformation(arrayInformation: unknown): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUBindGroup characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUBindGroupInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUBindGroupInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUBindGroup.
 * @param {IWebGPUBindGroupInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUBindGroupInitialValues
): vtkWebGPUBindGroup;

export declare const vtkWebGPUBindGroup: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUBindGroup;
