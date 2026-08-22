/**
 * Playback state of a cue. A cue that never ran and a cue that reached its
 * end time are both STOPPED, and isCueStarted() tells the two apart.
 */
export declare enum CueState {
  STOPPED = 0,
  PLAYING = 1,
  PAUSED = 2,
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
