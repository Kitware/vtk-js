/// <reference types="@webgpu/types" />

import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkWebGPUDevice from '../Device';
import vtkWebGPUShaderDescription from '../ShaderDescription';

export interface IWebGPUShaderModuleInitialValues {
  device?: Nullable<vtkWebGPUDevice>;
  handle?: Nullable<GPUShaderModule>;
}

export interface vtkWebGPUShaderModule extends vtkObject {
  /**
   * Create the GPU shader module from the WGSL code of the description.
   * @param {vtkWebGPUDevice} device
   * @param {vtkWebGPUShaderDescription} shaderDesc
   */
  initialize(
    device: vtkWebGPUDevice,
    shaderDesc: vtkWebGPUShaderDescription
  ): void;

  /**
   * Get the modified time of the camera this module was last built for.
   */
  getLastCameraMTime(): number;

  /**
   * Get the device this module was created on.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device this module was created on.
   * @param {vtkWebGPUDevice} device
   */
  setDevice(device: Nullable<vtkWebGPUDevice>): boolean;

  /**
   * Get the underlying GPU shader module.
   */
  getHandle(): Nullable<GPUShaderModule>;

  /**
   * Set the underlying GPU shader module.
   * @param {GPUShaderModule} handle
   */
  setHandle(handle: Nullable<GPUShaderModule>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUShaderModule characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUShaderModuleInitialValues} [initialValues] (default: {})
 */
declare function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUShaderModuleInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUShaderModule.
 * @param {IWebGPUShaderModuleInitialValues} [initialValues] for pre-setting some of its content
 */
declare function newInstance(
  initialValues?: IWebGPUShaderModuleInitialValues
): vtkWebGPUShaderModule;

/**
 * A compiled WGSL shader module.
 */
export declare const vtkWebGPUShaderModule: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkWebGPUShaderModule;
