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
   * Get the time this cue holds, on the timeline of the scene that drives it.
   */
  getAnimationTime(): number;

  /**
   * Alias of getAnimationTime().
   */
  getTime(): number;

  /**
   * Get the time step of the last tick.
   */
  getDeltaTime(): number;

  /**
   * Get the wall clock time the last tick reported.
   */
  getClockTime(): number;

  /**
   * Start playing the cue. A paused active cue continues from the time it
   * holds; an uninitialized or inactive cue starts from the start time.
   */
  play(): void;

  /**
   * Pause the cue. Does nothing unless the cue is playing.
   */
  pause(): void;

  /**
   * Stop the cue and reset it to the start time. Does nothing when the cue is
   * already stopped at the start time.
   */
  stop(): void;

  /**
   * Get the state this cue holds. Distinct from the vtkObject getState()
   * that serializes the object.
   * @return {number} One of CueState.
   */
  getCueState(): number;

  /**
   * Set how the cue reads its own start and end times.
   * @param {number} timeMode One of TimeMode.
   * @return {boolean} true if the value was changed.
   */
  setTimeMode(timeMode: number): boolean;

  /**
   * Get how the cue reads its own start and end times.
   * @default TimeMode.RELATIVE
   */
  getTimeMode(): number;

  /**
   * Read the start and end times as fractions of the scene duration.
   */
  setTimeModeToNormalized(): boolean;

  /**
   * Read the start and end times on the timeline of the scene.
   */
  setTimeModeToRelative(): boolean;

  /**
   * True when an uninitialized cue reaches its start time.
   * @param {number} time
   */
  checkStartCue(time: number): boolean;

  /**
   * True when an active cue reaches its end time.
   * @param {number} time
   */
  checkEndCue(time: number): boolean;

  /**
   * True while the cue runs, that is between the two checks above.
   */
  isCueStarted(): boolean;

  /**
   * Reset the cue to UNINITIALIZED for another run.
   */
  initialize(): void;

  /**
   * End a running cue without waiting for the time to leave its window. This
   * invokes the end event.
   */
  finalize(): void;

  /**
   * Check if the cue is active (playing or paused).
   */
  isActive(): boolean;

  /**
   * Check if the cue is currently playing.
   */
  isPlaying(): boolean;

  /**
   * Move to a time inside the cue and report it through the tick event without
   * changing its lifecycle state, so a scene can scrub without starting it.
   * @param {number} time Time within the cue, clamped to its bounds.
   */
  setAnimationTime(time: number): void;

  /**
   * Alias of setAnimationTime().
   * @param {number} time Time within the cue, clamped to its bounds.
   */
  seek(time: number): void;

  /**
   * Called by the animation scene to update cue time each frame. An
   * UNINITIALIZED cue enters its window on its own and an INACTIVE cue ignores
   * subsequent ticks.
   * @param {number} currentTime Time the scene held before this step.
   * @param {number} deltaTime Length of this step.
   * @param {number} [clockTime] Wall clock time, reported by getClockTime().
   */
  tick(currentTime: number, deltaTime: number, clockTime?: number): void;

  /**
   * Register a callback function invoked when the time enters the cue window.
   * @param {Function} callback Function invoked with { time }.
   * @return {vtkSubscription} A subscription object to unsubscribe.
   */
  onStartCueEvent(callback: (evt: any) => void): vtkSubscription;

  /**
   * Invoke the start event with the given event data.
   * @param {object} event The event data.
   */
  invokeStartCueEvent(event: any): void;

  /**
   * Register a callback function invoked when the time leaves the cue window.
   * @param {Function} callback Function invoked with { time }.
   * @return {vtkSubscription} A subscription object to unsubscribe.
   */
  onEndCueEvent(callback: (evt: any) => void): vtkSubscription;

  /**
   * Invoke the end event with the given event data.
   * @param {object} event The event data.
   */
  invokeEndCueEvent(event: any): void;

  /**
   * Register a callback function invoked on each tick.
   * @param {Function} callback Function invoked with { time, deltaTime,
   * clockTime }.
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
