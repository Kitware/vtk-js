/**
 * Lifecycle state of a cue. This follows vtkAnimationCue: UNINITIALIZED is
 * before the cue window, ACTIVE is inside it, and INACTIVE is after it.
 */
export declare enum CueState {
  UNINITIALIZED = 0,
  INACTIVE = 1,
  ACTIVE = 2,
}

/**
 * How a cue reads its own start and end times.
 *
 * NORMALIZED: the times are fractions of the duration of the scene that drives
 * the cue, so 0 is the start of the scene and 1 its end.
 * RELATIVE: the times are on the timeline of that scene.
 */
export declare enum TimeMode {
  NORMALIZED = 0,
  RELATIVE = 1,
}

declare const _default: {
  CueState: typeof CueState;
  TimeMode: typeof TimeMode;
};
export default _default;
