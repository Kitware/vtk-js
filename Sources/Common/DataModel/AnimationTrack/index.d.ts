import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import { InterpolationMode, TrackType } from './Constants';

export interface IAnimationTrackInitialValues {
  /**
   * The name of the track.
   * @default ''
   */
  name?: string;

  /**
   * The type of transform this track controls (TRANSLATION, ROTATION, SCALE).
   * @default TrackType.TRANSLATION
   */
  trackType?: number;

  /**
   * The interpolation mode (STEP, LINEAR, CUBIC).
   * @default InterpolationMode.LINEAR
   */
  interpolationMode?: number;

  /**
   * The duration of the track.
   * @default 0
   */
  duration?: number;
}

export interface vtkAnimationTrack extends vtkObject {
  /**
   * Set the track name.
   * @param {string} name The name.
   * @return {boolean} true if the value was changed.
   */
  setName(name: string): boolean;

  /**
   * Get the track name.
   * @default ''
   */
  getName(): string;

  /**
   * Set the track type (TRANSLATION, ROTATION, SCALE).
   * @param {number} trackType The track type value.
   * @return {boolean} true if the value was changed.
   */
  setTrackType(trackType: number): boolean;

  /**
   * Get the track type (TRANSLATION, ROTATION, SCALE).
   * @default TrackType.TRANSLATION
   */
  getTrackType(): number;

  /**
   * Set the interpolation mode (STEP, LINEAR, CUBIC).
   * @param {number} interpolationMode The interpolation mode value.
   * @return {boolean} true if the value was changed.
   */
  setInterpolationMode(interpolationMode: number): boolean;

  /**
   * Get the interpolation mode (STEP, LINEAR, CUBIC).
   * @default InterpolationMode.LINEAR
   */
  getInterpolationMode(): number;

  /**
   * Set the duration of the track.
   * @param {number} duration The duration.
   * @return {boolean} true if the value was changed.
   */
  setDuration(duration: number): boolean;

  /**
   * Get the duration of the track (time of last keyframe).
   * @default 0
   */
  getDuration(): number;

  /**
   * Add a keyframe at a specific time with a value.
   * @param {number} time The time of the keyframe.
   * @param {Float32Array | number[]} value The value (vec3 or quat depending on track type).
   */
  addKeyframe(time: number, value: Float32Array | number[]): void;

  /**
   * Get the number of keyframes in this track.
   */
  getNumberOfKeyframes(): number;

  /**
   * Get the time of a keyframe by index.
   * @param {number} index The keyframe index, a whole number, zero or more.
   * @return {Nullable<number>} null when no keyframe holds that index.
   */
  getKeyframeTime(index: number): Nullable<number>;

  /**
   * Get the value of a keyframe by index.
   * @param {number} index The keyframe index, a whole number, zero or more.
   * @return {Nullable<Float32Array>} null when no keyframe holds that index.
   */
  getKeyframeValue(index: number): Nullable<Float32Array>;

  /**
   * Evaluate the track at a given time.
   * Uses the configured interpolation mode (STEP/LINEAR).
   * For rotation tracks, uses quaternion SLERP with LINEAR mode.
   * @param {number} time The time to evaluate at.
   * @return {Float32Array} The interpolated value.
   */
  evaluate(time: number): Float32Array;

  /**
   * Clear all keyframes from the track.
   * @return {boolean} true when the track held something to clear.
   */
  clear(): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAnimationTrack characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAnimationTrackInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAnimationTrackInitialValues
): void;

/**
 * Method used to create a new instance of vtkAnimationTrack.
 * @param {IAnimationTrackInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAnimationTrackInitialValues
): vtkAnimationTrack;

/**
 * vtkAnimationTrack represents a single animation channel that stores keyframes
 * and evaluates interpolated values at arbitrary times. Each track targets a
 * specific bone and transform type (translation, rotation, or scale). It supports
 * step and linear interpolation modes, with quaternion SLERP for rotation tracks.
 *
 * @see {@link InterpolationMode}
 * @see {@link TrackType}
 */
export declare const vtkAnimationTrack: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAnimationTrack;
