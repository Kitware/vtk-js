import { Nullable } from '../../../types';
import { vtkObject } from '../../../interfaces';
import vtkAnimationClip from '../../DataModel/AnimationClip';
import vtkAnimationScene from '../AnimationScene';
import vtkArmature from '../../DataModel/Armature';

/**
 * Skinning data associated with a bound actor.
 */
export interface SkinningData {
  jointMatrices: Float32Array;
  jointCount: number;
}

export interface AnimationBindingContext {
  animation: object;
  deltaTime: number;
  mixer: vtkAnimationMixer;
  time: number;
}

export interface AnimationSource {
  name: string;
  evaluate(time: number): unknown;
}

export interface AnimationSceneData {
  actors?: Map<string, object>;
  actorNodeIds?: Map<object, string>;
  nodeTransforms?: Map<string, object>;
  nodeChildren?: Map<string, string[]>;
  skins?: Map<string, object>;
  morphTargets?: Map<string, object>;
  materialProperties?: Map<string, object[]>;
  nodeLights?: Map<string, object>;
}

export interface IAnimationMixerInitialValues {
  /**
   * The skeleton to animate.
   * @default null
   */
  skeleton?: Nullable<vtkArmature>;
}

export interface vtkAnimationMixer extends vtkObject {
  /**
   * Add an animation scene to manage.
   * @param {vtkAnimationScene} scene The scene to add.
   * @return {boolean} true when the scene was added, false when the mixer
   * already holds it.
   */
  addScene(scene: vtkAnimationScene): boolean;

  /**
   * Remove a scene.
   * @param {vtkAnimationScene} scene The scene to remove.
   * @return {boolean} true when the scene was removed, false when the mixer
   * does not hold it.
   */
  removeScene(scene: vtkAnimationScene): boolean;

  /**
   * Get a copy of the list of scenes.
   */
  getScenes(): vtkAnimationScene[];

  /**
   * Get the list of scenes without copying it.
   */
  getScenesByReference(): vtkAnimationScene[];

  /**
   * Add an animation clip to the mixer.
   * @param {vtkAnimationClip} clip The clip to add.
   * @return {boolean} true when the clip was added, false when it has no name
   * or the name is already taken.
   */
  addClip(clip: vtkAnimationClip): boolean;

  /**
   * Remove a clip by name. A clip that plays stops first.
   * @param {string} name The clip name.
   * @return {boolean} true when the clip was removed.
   */
  removeClip(name: string): boolean;

  /**
   * Get a clip by name.
   * @param {string} name The clip name.
   * @return {Nullable<vtkAnimationClip>} The clip, or null if not found.
   */
  getClip(name: string): Nullable<vtkAnimationClip>;

  /**
   * Get all clip names.
   */
  getClipNames(): string[];

  /**
   * Get the number of clips in the mixer.
   */
  getNumberOfClips(): number;

  /**
   * Play a clip by name.
   * @param {string} clipName The name of the clip to play.
   * @param {object} [options] Playback options.
   * @param {boolean} [options.loop] Whether to loop the animation.
   */
  playClip(clipName: string, options?: { loop?: boolean }): boolean;

  /**
   * Pause the currently playing clip.
   */
  pauseClip(): void;

  /**
   * Resume the currently paused clip.
   */
  resumeClip(): void;

  /**
   * Stop all playback and reset.
   */
  stop(): void;

  /**
   * Get the name of the currently playing clip.
   */
  getCurrentClipName(): Nullable<string>;

  /**
   * Check if the mixer is currently playing.
   */
  isPlaying(): boolean;

  /**
   * Set the skeleton to animate.
   * @param {Nullable<vtkArmature>} skeleton The skeleton.
   * @return {boolean} true if the value was changed.
   */
  setSkeleton(skeleton: Nullable<vtkArmature>): boolean;

  /**
   * Get the skeleton being animated.
   * @default null
   */
  getSkeleton(): Nullable<vtkArmature>;

  /**
   * Seek to a normalized time in the current clip [0, 1].
   * @param {number} t Normalized time.
   */
  setClipTime(t: number): void;

  /**
   * Get the current normalized time in the clip [0, 1].
   */
  getClipTime(): number;

  /**
   * Advance animation by delta time. Called each frame by the render loop.
   * After the scene/cue updates the skeleton pose, pushes skinning matrices to actors.
   * @param {number} deltaTime Seconds since last frame.
   */
  tick(deltaTime: number): void;

  /**
   * Bind an actor to this mixer so skinning matrices are pushed to it each tick.
   * @param {object} actor The actor to bind.
   * @param {object} [skeleton] Optional skeleton source for this actor.
   */
  bindActor(actor: object, skeleton?: object): void;

  /**
   * Unbind a previously bound actor.
   * @param {object} actor The actor to unbind.
   */
  unbindActor(actor: object): void;

  /**
   * Get all bound actors.
   */
  getBoundActors(): object[];

  /**
   * Add a non-skeletal animation binding.
   * @param {string} name Unique binding name.
   * @param {object[]} animations Array of objects with evaluate(time).
   * @param {Function} apply Function called with evaluated updates and context.
   * @param {object} [options] Binding options.
   * @return {boolean} true when the binding was added, false when the name is
   * already taken. Remove the binding first to replace it.
   */
  addAnimationBinding(
    name: string,
    apply: (updates: unknown, context: AnimationBindingContext) => void,
    animations?: object[],
    options?: { enabled?: boolean; time?: number }
  ): boolean;

  /**
   * Remove a non-skeletal animation binding by name.
   * @param {string} name Binding name.
   */
  removeAnimationBinding(name: string): boolean;

  /**
   * Get registered non-skeletal animation binding names.
   */
  getAnimationBindingNames(): string[];

  /**
   * Configure scene graph data used by node, morph, and pointer animations.
   * Importers should normally expose a factory that performs this wiring.
   */
  setScene(sceneData: AnimationSceneData): void;

  /** Set parsed node animations. */
  setNodeAnimations(animations: AnimationSource[]): void;

  /** Set parsed pointer animations. */
  setPointerAnimations(animations: AnimationSource[]): void;

  /** Get parsed node animations. */
  getNodeAnimations(): AnimationSource[];

  /** Get parsed pointer animations. */
  getPointerAnimations(): AnimationSource[];

  /** Get node animation names. */
  getNodeAnimationNames(): string[];

  /** Get pointer animation names. */
  getPointerAnimationNames(): string[];

  /** Get unique imported animation names across all channel types. */
  getAnimationNames(): string[];

  /** Play every imported animation channel with the given name. */
  playAnimation(name: string): boolean;

  /** Play a node animation by name, or the first one when omitted. */
  playNodeAnimation(name?: string): void;

  /** Play a pointer animation by name, or the first one when omitted. */
  playPointerAnimation(name?: string): void;

  /** Return true when the mixer contains any animation. */
  hasAnimations(): boolean;
}

/**
 * Get skinning data for a bound actor.
 * Used by WebGPU CellArrayMapper to retrieve joint matrices.
 * @param {object} actor The actor to query.
 * @return {Nullable<SkinningData>} The skinning data, or null.
 */
export function getSkinningData(actor: object): Nullable<SkinningData>;

/**
 * Method used to decorate a given object (publicAPI+model) with vtkAnimationMixer characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IAnimationMixerInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IAnimationMixerInitialValues
): void;

/**
 * Method used to create a new instance of vtkAnimationMixer.
 * @param {IAnimationMixerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IAnimationMixerInitialValues
): vtkAnimationMixer;

/**
 * vtkAnimationMixer is the central controller for skeletal animation playback.
 * It manages animation clips, registers scenes, and coordinates the evaluation
 * of skeletal poses. After each tick, it pushes computed skinning matrices to
 * all bound actors for GPU-based rendering. It also exports a standalone
 * getSkinningData function used by rendering backends.
 */
export declare const vtkAnimationMixer: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkAnimationMixer;
