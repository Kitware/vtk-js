import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkWebGPUDevice from '../Device';
import vtkWebGPURenderWindow from '../RenderWindow';
import vtkWebGPUShaderDescription from '../ShaderDescription';
import vtkWebGPUShaderModule from '../ShaderModule';

/**
 * The outcome of a shader source substitution.
 */
export interface IWebGPUShaderSubstitution {
  /**
   * Whether the searched pattern was present in the source.
   */
  replace: boolean;

  /**
   * The source with the substitution applied.
   */
  result: string;
}

/**
 * Perform in place string substitutions on a shader source.
 *
 * @param {String} source the shader source
 * @param {String} search the pattern to replace
 * @param {String|String[]} replace the replacement, joined by newlines when an array
 * @param {Boolean} [all] replace every occurrence (default: true)
 */
declare function substitute(
  source: string,
  search: string,
  replace: string | string[],
  all?: boolean
): IWebGPUShaderSubstitution;

export interface IWebGPUShaderCacheInitialValues {
  device?: Nullable<vtkWebGPUDevice>;
  window?: Nullable<vtkWebGPURenderWindow>;
}

export interface vtkWebGPUShaderCache extends vtkObject {
  /**
   * Get the shader module for a description, creating and caching it when no
   * module with the same type and hash was built yet.
   * @param {vtkWebGPUShaderDescription} shaderDesc
   */
  getShaderModule(
    shaderDesc: vtkWebGPUShaderDescription
  ): vtkWebGPUShaderModule;

  /**
   * Get the device the cached modules are created on.
   */
  getDevice(): Nullable<vtkWebGPUDevice>;

  /**
   * Set the device the cached modules are created on.
   * @param {vtkWebGPUDevice} device
   */
  setDevice(device: Nullable<vtkWebGPUDevice>): boolean;

  /**
   * Get the render window this cache belongs to.
   */
  getWindow(): Nullable<vtkWebGPURenderWindow>;

  /**
   * Set the render window this cache belongs to.
   * @param {vtkWebGPURenderWindow} window
   */
  setWindow(window: Nullable<vtkWebGPURenderWindow>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkWebGPUShaderCache characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IWebGPUShaderCacheInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUShaderCacheInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUShaderCache.
 * @param {IWebGPUShaderCacheInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUShaderCacheInitialValues
): vtkWebGPUShaderCache;

/**
 * Caches the shader modules of a device, keyed by shader type and hash.
 */
export declare const vtkWebGPUShaderCache: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  substitute: typeof substitute;
};
export default vtkWebGPUShaderCache;
