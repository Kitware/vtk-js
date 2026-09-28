import { vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable } from '../../../types';

export interface IWebGPUPassTime {
  /** The label of the render encoder of the pass. */
  label: string;
  /** The GPU time of the pass in milliseconds. */
  ms: number;
}

export interface IWebGPUPassTimes {
  /** The render passes of the frame, in the order of the command encoder. */
  passes: IWebGPUPassTime[];
  /** The sum of the times of the passes in milliseconds. */
  totalMs: number;
}

export interface IWebGPUPassTimerInitialValues {
  /**
   * Time the render passes of each frame.
   * @defaultValue false
   */
  enabled?: boolean;

  /**
   * The number of passes that a frame can time. Passes after this number are
   * not timed.
   * @defaultValue 64
   */
  maximumNumberOfPasses?: number;
}

/**
 * vtkWebGPUPassTimer measures the GPU time of each render pass of a frame
 * with WebGPU timestamp queries. The device must have the feature
 * `timestamp-query`, which vtkWebGPUConfiguration requests by default when
 * the adapter offers it.
 *
 * The results come back asynchronously, one or more frames later, through the
 * `passTimes` event. The browser can quantize the timestamps (Chrome uses
 * 100 microseconds unless the WebGPU developer features are enabled).
 */
export interface vtkWebGPUPassTimer extends vtkObject {
  /**
   * Get whether the timer times the render passes of each frame.
   */
  getEnabled(): boolean;

  /**
   * Time the render passes of each frame.
   * @param enabled Whether to time the frames.
   */
  setEnabled(enabled: boolean): boolean;

  /**
   * Get the number of passes that a frame can time.
   */
  getMaximumNumberOfPasses(): number;

  /**
   * Get the results of the last frame that has results, or null.
   */
  getLastPassTimes(): Nullable<IWebGPUPassTimes>;

  /**
   * Get whether the device can time passes (feature `timestamp-query`).
   * @param device The vtkWebGPUDevice.
   */
  isSupported(device: any): boolean;

  /**
   * Start to time the render passes that the command encoder records. The
   * render window calls this for each frame.
   * @param device The vtkWebGPUDevice.
   * @param commandEncoder The GPUCommandEncoder of the frame.
   */
  beginFrame(device: any, commandEncoder: GPUCommandEncoder): void;

  /**
   * Get the timestamp writes for the next render pass of the frame, or
   * undefined when the frame is full.
   * @param label The name of the pass in the results.
   */
  getTimestampWrites(label: string): GPURenderPassTimestampWrites | undefined;

  /**
   * Record the copy of the timestamps. Call before the submit.
   */
  endFrame(): void;

  /**
   * Read the timestamps of the frame. Call after the submit.
   */
  readResults(): void;

  /**
   * Call the callback with the results of each timed frame.
   * @param callback The function to call.
   */
  onPassTimes(callback: (times: IWebGPUPassTimes) => void): vtkSubscription;

  /**
   * Release the query set and the buffers.
   */
  releaseGraphicsResources(): void;
}

/**
 * Get the timestamp writes for a render pass that the command encoder
 * records, or undefined when no timer times that command encoder.
 * @param commandEncoder The GPUCommandEncoder.
 * @param label The name of the pass in the results.
 */
export function getTimestampWrites(
  commandEncoder: GPUCommandEncoder,
  label: string
): GPURenderPassTimestampWrites | undefined;

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkWebGPUPassTimer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param initialValues (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IWebGPUPassTimerInitialValues
): void;

/**
 * Method used to create a new instance of vtkWebGPUPassTimer.
 *
 * @param initialValues for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IWebGPUPassTimerInitialValues
): vtkWebGPUPassTimer;

/**
 * vtkWebGPUPassTimer measures the GPU time of each render pass of a frame.
 *
 * @example
 * ```js
 * const timer = view.getPassTimer();
 * timer.setEnabled(true);
 * timer.onPassTimes(({ passes, totalMs }) => {
 *   console.log(totalMs, passes);
 * });
 * ```
 */
export declare const vtkWebGPUPassTimer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  getTimestampWrites: typeof getTimestampWrites;
};

export default vtkWebGPUPassTimer;
