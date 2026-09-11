import { vtkObject } from '../../../interfaces';
import { Nullable } from '../../../types';

/**
 * Power preference sent to the browser when an adapter is requested.
 *
 * - `high-performance` selects the discrete GPU on a system that has one.
 * - `low-power` selects the integrated GPU to save battery.
 */
export type PowerPreference = 'low-power' | 'high-performance';

/**
 * Limits that the adapter and the device must supply. Each key is a WebGPU
 * limit name, and each value is the smallest acceptable value for it.
 *
 * @example
 * ```js
 * { maxBufferSize: 268435456, maxUniformBufferBindingSize: 65536 }
 * ```
 */
export type RequiredLimits = Record<string, number>;

export interface IWebGPUConfigurationInitialValues {
  /**
   * Power preference for the adapter request.
   * @defaultValue 'high-performance'
   */
  powerPreference?: PowerPreference;

  /**
   * Limits that the adapter and the device must supply. When this is null,
   * initialization asks for the largest buffer sizes that the adapter offers.
   * @defaultValue null
   */
  requiredLimits?: Nullable<RequiredLimits>;
}

export interface vtkWebGPUConfiguration extends vtkObject {
  /**
   * Request an adapter and a device.
   *
   * The call does nothing and gives true if a device is already available.
   * Calls that occur while a request is in progress wait for that same
   * request. The request fails if the adapter or the device cannot supply the
   * required limits. An error message then tells which limit failed.
   *
   * A render window calls this during its own initialization. An application
   * calls it directly only to make sure that the device is available before
   * it builds its views.
   *
   * @returns true if a device is available
   */
  initialize(): Promise<boolean>;

  /**
   * Tell if a device is available.
   *
   * This becomes false again if the device is lost.
   */
  isInitialized(): boolean;

  /**
   * Release the adapter and the device that this configuration holds.
   *
   * The subsequent call to `initialize()` requests a new adapter and a new
   * device. This does not release the GPU resources of the render windows
   * that use this configuration. Call `releaseGraphicsResources()` on each of
   * those render windows before you call this.
   */
  finalize(): void;

  /**
   * Get the WebGPU adapter, or null before initialization.
   *
   * The type is the native `GPUAdapter`. The adapter is released together
   * with the device if the device is lost, because an adapter that lost its
   * device cannot make a new one.
   */
  getAdapter(): Nullable<any>;

  /**
   * Get the native WebGPU device, or null before initialization.
   *
   * The type is the native `GPUDevice`. Give this object to a library that
   * must record commands on the same device. Do not replace or destroy it
   * while render windows use this configuration.
   */
  getDevice(): Nullable<any>;

  /**
   * Tell if a device is available. This gives the same result as
   * `isInitialized()`.
   */
  getDeviceReady(): boolean;

  /**
   * Get the power preference used for the adapter request.
   */
  getPowerPreference(): PowerPreference;

  /**
   * Set the power preference for the adapter request.
   *
   * Set this before initialization, because the adapter is requested only one
   * time.
   *
   * @param powerPreference the preference to send to the browser
   * @returns true if the value changed
   */
  setPowerPreference(powerPreference: PowerPreference): boolean;

  /**
   * Get the limits that the adapter and the device must supply, or null if the
   * adapter limits are used.
   */
  getRequiredLimits(): Nullable<RequiredLimits>;

  /**
   * Set the limits that the adapter and the device must supply.
   *
   * Set this before initialization. Initialization fails, with a message for
   * each limit that is too small, if the adapter or the device cannot supply
   * these limits. Set null to ask for the largest buffer sizes that the
   * adapter offers.
   *
   * @param requiredLimits the limits, or null to use the adapter limits
   * @returns true if the value changed
   */
  setRequiredLimits(requiredLimits: Nullable<RequiredLimits>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkWebGPUConfiguration characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUConfigurationInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUConfiguration.
 *
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUConfigurationInitialValues
): vtkWebGPUConfiguration;

/**
 * vtkWebGPUConfiguration owns the WebGPU adapter and the device, independently
 * of a canvas or a render window.
 *
 * Feature and limit negotiation occurs in one place, as in the C++ class of
 * the same name. An application that wants more than one render window on one
 * device creates a configuration, then gives it to each render window with
 * `setWebGPUConfiguration()`. Those render windows share one device, and thus
 * one set of VTK.js resource caches.
 *
 * A render window that receives no configuration creates one for itself. An
 * application that shows only one view can thus ignore this class.
 *
 * @example
 * ```js
 * import vtkWebGPUConfiguration from '@kitware/vtk.js/Rendering/WebGPU/Configuration';
 *
 * const configuration = vtkWebGPUConfiguration.newInstance();
 * if (!(await configuration.initialize())) {
 *   throw new Error('No WebGPU device is available.');
 * }
 * firstView.setWebGPUConfiguration(configuration);
 * secondView.setWebGPUConfiguration(configuration);
 * ```
 */
export declare const vtkWebGPUConfiguration: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkWebGPUConfiguration;
