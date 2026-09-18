/**
 * AnimationScene constants
 */

/**
 * Playback state of an animation scene.
 */
export const SceneState = {
  STOPPED: 0,
  PLAYING: 1,
  PAUSED: 2,
};

/**
 * How a scene turns a tick into a time step.
 *
 * SEQUENCE: every tick advances by one frame of the frame rate, whatever the
 * caller reports, which gives the same result on every run.
 * REALTIME: every tick advances by the delta the caller reports, which is what
 * a render loop supplies.
 */
export const PlayMode = {
  SEQUENCE: 0,
  REALTIME: 1,
};

export default {
  SceneState,
  PlayMode,
};
