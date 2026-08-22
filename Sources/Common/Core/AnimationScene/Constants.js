import { CueState } from 'vtk.js/Sources/Common/Core/AnimationCue/Constants';

/**
 * AnimationScene constants
 */

/**
 * A scene is a cue, so it holds the cue states.
 */
export const SceneState = {
  STOPPED: CueState.STOPPED,
  PLAYING: CueState.PLAYING,
  PAUSED: CueState.PAUSED,
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
