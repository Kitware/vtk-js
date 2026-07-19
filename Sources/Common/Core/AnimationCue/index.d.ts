import { vtkObject, vtkSubscription } from '../../../interfaces';

export interface IAnimationCueInitialValues {
  /**
   * The start time of the cue.
   * @default 0
   */
  startTime?: number;

  /**
   * The end time of the cue.
   * @default 1
   */
  endTime?: number;
}

export interface vtkAnimationCue extends vtkObject {
  /**
   * Set the start time of this cue.
   * @param {number} startTime The start time.
   * @return {boolean} true if the value was changed.
   */
  setStartTime(startTime: number): boolean;

  /**
   * Get the start time of this cue.
   * @default 0
   */
  getStartTime(): number;

  /**
   * Set the end time of this cue.
   * @param {number} endTime The end time.
   * @return {boolean} true if the value was changed.
   */
  setEndTime(endTime: number): boolean;

  /**
   * Get the end time of this cue.
   * @default 1
   */
  getEndTime(): number;

  /**
   * Get the current elapsed time within this cue.
   */
  getTime(): number;

  /**
   * Start playing the cue.
   */
  play(): void;

  /**
   * Pause the cue.
   */
  pause(): void;

  /**
   * Stop and reset the cue to start time.
   */
  stop(): void;

  /**
   * Check if the cue is active (playing or paused).
   */
  isActive(): boolean;

  /**
   * Check if the cue is currently playing.
   */
  isPlaying(): boolean;

  /**
   * Called by the animation scene to update cue time each frame.
   * Invokes the tick event callback.
   * @param {number} time Current global time.
   * @param {number} deltaTime Time delta since last frame.
   */
  tick(time: number, deltaTime: number): void;

  /**
   * Register a callback function invoked on each tick.
   * @param {Function} callback Function invoked with { cue, time, deltaTime }.
   * @return {vtkSubscription} A subscription object to unsubscribe.
   */
  onTickEvent(callback: (evt: any) => void): vtkSubscription;

  /**
   * Invoke the tick event with the given event data.
   * @param {object} event The tick event data.
   */
  invokeTickEvent(event: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAnimationCue characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAnimationCueInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAnimationCueInitialValues
): void;

/**
 * Method used to create a new instance of vtkAnimationCue.
 * @param {IAnimationCueInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAnimationCueInitialValues
): vtkAnimationCue;

/**
 * vtkAnimationCue represents a single animation cue that can be played, paused,
 * and stopped. It tracks elapsed time between a start and end time and fires
 * tick events each frame to drive animation logic. Cues are typically managed
 * by a vtkAnimationScene.
 */
export declare const vtkAnimationCue: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAnimationCue;
