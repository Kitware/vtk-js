import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkAnimationCue from '../AnimationCue';

export interface IAnimationSceneInitialValues {
  /**
   * The start time of the scene.
   * @default 0
   */
  startTime?: number;

  /**
   * The end time of the scene.
   * @default 1
   */
  endTime?: number;

  /**
   * Whether the scene loops back to startTime when it reaches endTime.
   * @default true
   */
  loop?: boolean;
}

export interface vtkAnimationScene extends vtkObject {
  /**
   * Add a cue to this scene.
   * @param {vtkAnimationCue} cue The animation cue to add.
   */
  addCue(cue: vtkAnimationCue): void;

  /**
   * Remove a cue from this scene.
   * @param {vtkAnimationCue} cue The animation cue to remove.
   */
  removeCue(cue: vtkAnimationCue): void;

  /**
   * Get the number of cues in this scene.
   */
  getNumberOfCues(): number;

  /**
   * Get a cue by index.
   * @param {number} index The cue index.
   * @return {Nullable<vtkAnimationCue>} The cue at the given index, or null.
   */
  getCue(index: number): Nullable<vtkAnimationCue>;

  /**
   * Get all cues in this scene.
   */
  getCues(): vtkAnimationCue[];

  /**
   * Set the start time of the scene.
   * @param {number} startTime The start time.
   * @return {boolean} true if the value was changed.
   */
  setStartTime(startTime: number): boolean;

  /**
   * Get the start time of the scene.
   * @default 0
   */
  getStartTime(): number;

  /**
   * Set the end time of the scene.
   * @param {number} endTime The end time.
   * @return {boolean} true if the value was changed.
   */
  setEndTime(endTime: number): boolean;

  /**
   * Get the end time of the scene.
   * @default 1
   */
  getEndTime(): number;

  /**
   * Set whether the scene should loop.
   * @param {boolean} loop True to enable looping.
   * @return {boolean} true if the value was changed.
   */
  setLoop(loop: boolean): boolean;

  /**
   * Get whether the scene loops.
   * @default true
   */
  getLoop(): boolean;

  /**
   * Get the current global time of the scene.
   */
  getTime(): number;

  /**
   * Start playing all cues in this scene.
   */
  play(): void;

  /**
   * Pause all cues in this scene.
   */
  pause(): void;

  /**
   * Stop all cues and reset to start time.
   */
  stop(): void;

  /**
   * Seek to a specific time and update all cues.
   * @param {number} time The time to seek to.
   */
  seek(time: number): void;

  /**
   * Check if the scene is currently playing.
   */
  isPlaying(): boolean;

  /**
   * Called by the render loop to advance animation each frame.
   * @param {number} deltaTime The time delta since last frame.
   */
  tick(deltaTime: number): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAnimationScene characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAnimationSceneInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAnimationSceneInitialValues
): void;

/**
 * Method used to create a new instance of vtkAnimationScene.
 * @param {IAnimationSceneInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAnimationSceneInitialValues
): vtkAnimationScene;

/**
 * vtkAnimationScene orchestrates the playback of multiple animation cues.
 * It manages global time, supports looping, and dispatches tick events to
 * all registered cues each frame. Scenes can be played, paused, stopped,
 * and seeked to arbitrary times.
 */
export declare const vtkAnimationScene: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAnimationScene;
