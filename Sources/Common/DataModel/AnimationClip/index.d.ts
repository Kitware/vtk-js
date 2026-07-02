import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkAnimationTrack from '../AnimationTrack';

export interface IAnimationClipInitialValues {
  /**
   * The name of the clip.
   * @default ''
   */
  name?: string;

  /**
   * The duration of the clip.
   * @default 0
   */
  duration?: number;
}

export interface vtkAnimationClip extends vtkObject {
  /**
   * Set the clip name.
   * @param {string} name The name.
   * @return {boolean} true if the value was changed.
   */
  setName(name: string): boolean;

  /**
   * Get the clip name.
   * @default ''
   */
  getName(): string;

  /**
   * Set the duration of the clip.
   * @param {number} duration The duration.
   * @return {boolean} true if the value was changed.
   */
  setDuration(duration: number): boolean;

  /**
   * Get the duration of the clip (maximum duration of all tracks).
   * @default 0
   */
  getDuration(): number;

  /**
   * Add a track to this clip.
   * @param {vtkAnimationTrack} track The animation track to add.
   */
  addTrack(track: vtkAnimationTrack): void;

  /**
   * Remove a track by index.
   * @param {number} index The track index.
   */
  removeTrack(index: number): void;

  /**
   * Get the number of tracks in this clip.
   */
  getNumberOfTracks(): number;

  /**
   * Get a track by index.
   * @param {number} index The track index.
   * @return {Nullable<vtkAnimationTrack>} The track, or null if out of range.
   */
  getTrack(index: number): Nullable<vtkAnimationTrack>;

  /**
   * Get all tracks in this clip.
   */
  getTracks(): vtkAnimationTrack[];

  /**
   * Find a track by name.
   * @param {string} name The track name.
   * @return {Nullable<vtkAnimationTrack>} The matching track, or null.
   */
  getTrackByName(name: string): Nullable<vtkAnimationTrack>;

  /**
   * Clear all tracks from the clip.
   */
  clear(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAnimationClip characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAnimationClipInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAnimationClipInitialValues
): void;

/**
 * Method used to create a new instance of vtkAnimationClip.
 * @param {IAnimationClipInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAnimationClipInitialValues
): vtkAnimationClip;

/**
 * vtkAnimationClip is a container for multiple animation tracks that together
 * define a named animation. Each track targets a specific bone and transform
 * channel. The clip computes its duration as the maximum duration across all
 * contained tracks.
 */
export declare const vtkAnimationClip: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAnimationClip;
