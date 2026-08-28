import { Nullable } from '../../../types';
import vtkAnimationCue, { IAnimationCueInitialValues } from '../AnimationCue';

export interface IAnimationSceneInitialValues extends IAnimationCueInitialValues {
  /**
   * Whether the scene loops back to startTime when it reaches endTime.
   * @default false
   */
  loop?: boolean;

  /**
   * How the scene turns a tick into a time step.
   * @default PlayMode.REALTIME
   */
  playMode?: number;

  /**
   * Frames per second used in PlayMode.SEQUENCE.
   * @default 60
   */
  frameRate?: number;
}

/**
 * A scene is itself a cue, so it inherits the start and end times, the state,
 * the current time, isActive, isPlaying and the tick event, and one scene can
 * be held by another scene.
 */
export interface vtkAnimationScene extends vtkAnimationCue {
  /**
   * Add a cue to this scene.
   * @param {vtkAnimationCue} cue The animation cue to add.
   * @return {boolean} true when the cue was added, false when the scene
   * already holds it.
   */
  addCue(cue: vtkAnimationCue): boolean;

  /**
   * Remove a cue from this scene.
   * @param {vtkAnimationCue} cue The animation cue to remove.
   * @return {boolean} true when the cue was removed.
   */
  removeCue(cue: vtkAnimationCue): boolean;

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
   * Remove every cue from this scene.
   * @return {boolean} true when the scene held at least one cue.
   */
  removeAllCues(): boolean;

  /**
   * Get a copy of the list of cues in this scene.
   */
  getCues(): vtkAnimationCue[];

  /**
   * Get the list of cues without copying it.
   */
  getCuesByReference(): vtkAnimationCue[];

  /**
   * Set whether the scene should loop.
   * @param {boolean} loop True to enable looping.
   * @return {boolean} true if the value was changed.
   */
  setLoop(loop: boolean): boolean;

  /**
   * Get whether the scene loops.
   * @default false
   */
  getLoop(): boolean;

  /**
   * Set how the scene turns a tick into a time step. In PlayMode.SEQUENCE
   * every tick advances by one frame of the frame rate, whatever the caller
   * reports, so a run is repeatable. In PlayMode.REALTIME every tick advances
   * by the delta the caller reports, which is what a render loop supplies.
   * @param {number} playMode One of PlayMode.
   * @return {boolean} true if the value was changed.
   */
  setPlayMode(playMode: number): boolean;

  /**
   * Get how the scene turns a tick into a time step.
   * @default PlayMode.REALTIME
   */
  getPlayMode(): number;

  /**
   * Play by steps of one frame, the same on every run.
   */
  setPlayModeToSequence(): boolean;

  /**
   * Play by the time step the caller reports.
   */
  setPlayModeToRealTime(): boolean;

  /**
   * Set the frames per second used in PlayMode.SEQUENCE.
   * @param {number} frameRate
   * @return {boolean} true if the value was changed.
   */
  setFrameRate(frameRate: number): boolean;

  /**
   * Get the frames per second used in PlayMode.SEQUENCE.
   * @default 60
   */
  getFrameRate(): number;

  /**
   * Move the scene to a state and carry that state into every cue. Does
   * nothing when the scene already holds that state. Read it back with the
   * inherited getCueState().
   * @param {number} state One of SceneState.
   * @return {boolean} true when the state changed.
   */
  setCueState(state: number): boolean;

  /**
   * Play the scene and every cue it holds. A playing scene ignores the call, a
   * paused scene continues from the time it holds, and a stopped scene plays
   * again from the start time.
   * @return {boolean} true when the state changed.
   */
  play(): boolean;

  /**
   * Alias of play().
   * @return {boolean} true when the state changed.
   */
  start(): boolean;

  /**
   * Pause the scene and every cue it holds. Does nothing unless the scene
   * plays. A caller that drives the scene itself can stop ticking it instead.
   * @return {boolean} true when the state changed.
   */
  pause(): boolean;

  /**
   * Alias of isPlaying().
   */
  isInPlay(): boolean;

  /**
   * Stop the scene, reset it to the start time and stop every cue. Does
   * nothing when the scene is already stopped, so a scene that ran to its end
   * time keeps reporting that end time until it starts again.
   * @return {boolean} true when the state changed.
   */
  stop(): boolean;

  /**
   * Move to a time without changing the state, so a paused scene stays
   * paused. A cue outside the time stops, and a cue inside it moves to that
   * same time and reports it through its own tick event.
   * @param {number} time The time to move to, clamped to the scene bounds.
   */
  setAnimationTime(time: number): void;

  /**
   * Alias of setAnimationTime().
   * @param {number} time The time to move to, clamped to the scene bounds.
   */
  seek(time: number): void;

  /**
   * Advance the scene and every cue it holds. The scene owns its clock, so it
   * moves by deltaTime and ignores the time the caller reports. The unused
   * first argument keeps the signature of the cue this class derives from.
   * @param {number} currentTime Unused.
   * @param {number} deltaTime The time delta since last frame.
   * @param {number} [clockTime] Wall clock time, handed down to the cues.
   */
  tick(currentTime: number, deltaTime: number, clockTime?: number): void;
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
