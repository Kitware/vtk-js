/**
 * AnimationCue constants
 */

/**
 * Lifecycle state of a cue. This follows vtkAnimationCue: UNINITIALIZED is
 * before the cue window, ACTIVE is inside it, and INACTIVE is after it.
 */
export const CueState = {
  UNINITIALIZED: 0,
  INACTIVE: 1,
  ACTIVE: 2,
};

/**
 * How a cue reads its own start and end times.
 *
 * NORMALIZED: the times are fractions of the duration of the scene that drives
 * the cue, so 0 is the start of the scene and 1 its end.
 * RELATIVE: the times are on the timeline of that scene.
 */
export const TimeMode = {
  NORMALIZED: 0,
  RELATIVE: 1,
};

export default {
  CueState,
  TimeMode,
};
