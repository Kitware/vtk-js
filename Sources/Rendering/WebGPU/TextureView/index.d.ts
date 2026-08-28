/// <reference types="@webgpu/types" />

import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUSampler from '../Sampler';
import vtkWebGPUTexture from '../Texture';

export interface IWebGPUTextureViewInitialValues {
  texture?: any;
  handle?: GPUTextureView;
  sampler?: vtkWebGPUSampler;
  label?: string;
  bindGroupLayoutEntry?: Partial<GPUBindGroupLayoutEntry>;
}

export interface vtkWebGPUTextureView extends vtkObject {
  /**
   * Create a view of the given texture. The view is recreated automatically
   * when the texture handle changes.
   * @param texture The vtkWebGPUTexture to view.
   * @param options The view descriptor, defaulting the dimension to '2d'.
   */
  create(texture: any, options: GPUTextureViewDescriptor): void;

  /**
   * Create a view of a GPUTexture that is not owned by a vtkWebGPUTexture.
   * @param textureHandle The GPUTexture to view.
   * @param options The view descriptor, whose format drives the sample type.
   */
  createFromTextureHandle(
    textureHandle: GPUTexture,
    options: GPUTextureViewDescriptor
  ): void;

  /**
   * Get the bind group entry for this view. The binding index is filled in by
   * the bind group.
   */
  getBindGroupEntry(): Omit<GPUBindGroupEntry, 'binding'>;

  /**
   * Get the WGSL declaration of this texture.
   * @param binding The binding index.
   * @param group The bind group index.
   */
  getShaderCode(binding: number, group: number): string;

  /**
   * Create a sampler for this view and set it as the current sampler.
   * @param device The device to create the sampler on.
   * @param {GPUSamplerDescriptor} [options] The sampler descriptor.
   */
  addSampler(device: vtkWebGPUDevice, options?: GPUSamplerDescriptor): void;

  /**
   * Get the object whose modified time changes when the view is recreated.
   */
  getBindGroupTime(): vtkObject;

  /**
   * Get the GPUTextureView, recreating it when the texture handle changed.
   */
  getHandle(): Nullable<GPUTextureView>;

  /**
   * Get the vtkWebGPUTexture this is a view of.
   */
  getTexture(): Nullable<vtkWebGPUTexture>;

  /**
   * Get the bind group layout entry describing this view.
   */
  getBindGroupLayoutEntry(): Partial<GPUBindGroupLayoutEntry>;

  /**
   * Set the bind group layout entry describing this view.
   */
  setBindGroupLayoutEntry(
    bindGroupLayoutEntry: Partial<GPUBindGroupLayoutEntry>
  ): boolean;

  /**
   * Get the WGSL name of the texture.
   */
  getLabel(): Nullable<string>;

  /**
   * Set the WGSL name of the texture.
   */
  setLabel(label: string): boolean;

  /**
   * Get the sampler paired with this view.
   */
  getSampler(): Nullable<vtkWebGPUSampler>;

  /**
   * Set the sampler paired with this view.
   */
  setSampler(sampler: vtkWebGPUSampler): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUTextureView characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUTextureViewInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUTextureViewInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUTextureView.
 * @param {IWebGPUTextureViewInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUTextureViewInitialValues
): vtkWebGPUTextureView;

export declare const vtkWebGPUTextureView: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUTextureView;
