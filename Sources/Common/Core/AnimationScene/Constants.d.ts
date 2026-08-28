/**
 * A scene is a cue, so it holds the cue states.
 */
export declare enum SceneState {
  STOPPED = 0,
  PLAYING = 1,
  PAUSED = 2,
}

/**
 * How a scene turns a tick into a time step.
 *
 * SEQUENCE: every tick advances by one frame of the frame rate, whatever the
 * caller reports, which gives the same result on every run.
 * REALTIME: every tick advances by the delta the caller reports, which is what
 * a render loop supplies.
 */
export declare enum PlayMode {
  SEQUENCE = 0,
  REALTIME = 1,
}

declare const _default: {
  SceneState: typeof SceneState;
  PlayMode: typeof PlayMode;
};
export default _default;
