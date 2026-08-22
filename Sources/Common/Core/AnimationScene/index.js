import macro from 'vtk.js/Sources/macros';
import vtkAnimationCue from 'vtk.js/Sources/Common/Core/AnimationCue';
import { TimeMode } from 'vtk.js/Sources/Common/Core/AnimationCue/Constants';
import {
  PlayMode,
  SceneState,
} from 'vtk.js/Sources/Common/Core/AnimationScene/Constants';

// ---------------------------------------------------------------------------
// vtkAnimationScene methods
// ---------------------------------------------------------------------------

function vtkAnimationScene(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationScene');

  /**
   * Add a cue to this scene
   * @param {vtkAnimationCue} cue
   * @return {boolean} true when the cue was added
   */
  publicAPI.addCue = (cue) => {
    if (model.cues.includes(cue)) {
      return false;
    }
    model.cues.push(cue);
    publicAPI.modified();
    return true;
  };

  /**
   * Remove a cue from this scene
   * @param {vtkAnimationCue} cue
   * @return {boolean} true when the cue was removed
   */
  publicAPI.removeCue = (cue) => {
    const idx = model.cues.indexOf(cue);
    if (idx === -1) {
      return false;
    }
    model.cues.splice(idx, 1);
    publicAPI.modified();
    return true;
  };

  /**
   * Remove every cue from this scene
   * @return {boolean} true when the scene held at least one cue
   */
  publicAPI.removeAllCues = () => {
    if (model.cues.length === 0) {
      return false;
    }
    model.cues.length = 0;
    publicAPI.modified();
    return true;
  };

  /**
   * Get the number of cues
   * @return {number}
   */
  publicAPI.getNumberOfCues = () => model.cues.length;

  /**
   * Get a cue by index
   * @param {number} index
   * @return {vtkAnimationCue}
   */
  publicAPI.getCue = (index) => {
    if (index >= 0 && index < model.cues.length) {
      return model.cues[index];
    }
    return null;
  };

  /**
   * Turn the time of the scene into the time a cue reads, which depends on the
   * time mode that the cue declares.
   * @param {vtkAnimationCue} cue
   * @return {number}
   */
  function timeForCue(cue) {
    if (cue.getTimeMode() !== TimeMode.NORMALIZED) {
      return model.currentTime;
    }
    const duration = model.endTime - model.startTime;
    if (duration <= 0) {
      return 0;
    }
    return (model.currentTime - model.startTime) / duration;
  }

  /** Arm every cue for another run */
  publicAPI.initialize = () => {
    model.cues.forEach((cue) => cue.initialize());
  };

  /** End every cue that runs */
  publicAPI.finalize = () => {
    model.cues.forEach((cue) => cue.finalize());
  };

  /** Play by steps of one frame, the same on every run */
  publicAPI.setPlayModeToSequence = () =>
    publicAPI.setPlayMode(PlayMode.SEQUENCE);

  /** Play by the time step the caller reports */
  publicAPI.setPlayModeToRealTime = () =>
    publicAPI.setPlayMode(PlayMode.REALTIME);

  /**
   * Move to a state and let _onStateChanged carry the state into the cues.
   * Read the state back with the inherited getCueState().
   * @param {number} state One of SceneState
   * @return {boolean} true when the state changed
   */
  publicAPI.setCueState = (state) => {
    if (model.state === state) {
      return false;
    }
    const previousState = model.state;
    model.state = state;
    model._onStateChanged(previousState);
    publicAPI.modified();
    return true;
  };

  /**
   * Play the scene. A playing scene ignores the call, a paused scene continues
   * from the time it holds, and a stopped scene plays again from the start
   * time.
   * @return {boolean} true when the state changed
   */
  publicAPI.play = () => publicAPI.setCueState(SceneState.PLAYING);

  /** Alias of play() */
  publicAPI.start = publicAPI.play;

  /**
   * Pause the scene. Does nothing unless the scene plays.
   * @return {boolean} true when the state changed
   */
  publicAPI.pause = () => {
    if (model.state !== SceneState.PLAYING) {
      return false;
    }
    return publicAPI.setCueState(SceneState.PAUSED);
  };

  /**
   * Stop the scene and reset it to the start time. Does nothing when the scene
   * is already stopped, so a scene that ran to its end time keeps reporting
   * that end time until it plays again.
   * @return {boolean} true when the state changed
   */
  publicAPI.stop = () => publicAPI.setCueState(SceneState.STOPPED);

  /** Alias of isPlaying() */
  publicAPI.isInPlay = publicAPI.isPlaying;

  model._onStateChanged = (previousState) => {
    if (model.state === SceneState.PLAYING) {
      // a stopped scene starts over, a paused scene continues where it was
      if (previousState === SceneState.STOPPED) {
        model.currentTime = model.startTime;
        publicAPI.initialize();
      }
      model.cues.forEach((cue) => cue.play());
    } else if (model.state === SceneState.PAUSED) {
      model.cues.forEach((cue) => cue.pause());
    } else {
      model.currentTime = model.startTime;
      model.cues.forEach((cue) => cue.stop());
    }
  };

  /**
   * Move to a time in the scene without changing the state, so a paused scene
   * stays paused. Every cue moves to the same time, read in the time mode that
   * the cue declares, and reports it through its tick event.
   * @param {number} time
   */
  publicAPI.setAnimationTime = (time) => {
    model.currentTime = Math.max(
      model.startTime,
      Math.min(time, model.endTime)
    );

    model.cues.forEach((cue) => cue.setAnimationTime(timeForCue(cue)));

    publicAPI.modified();
  };

  /** Alias of setAnimationTime() */
  publicAPI.seek = publicAPI.setAnimationTime;

  /**
   * Advance the scene and every cue it holds. The scene owns its clock, so it
   * moves by its own step and ignores the time the caller reports. A cue
   * enters and leaves its own window on its own, so the scene hands the same
   * time to all of them.
   * @param {number} currentTime Unused, present to match the cue signature
   * @param {number} deltaTime Length of this step, used in real time mode
   * @param {number} [clockTime] Wall clock time, handed down to the cues
   */
  publicAPI.tick = (currentTime, deltaTime, clockTime = 0) => {
    if (model.state !== SceneState.PLAYING) {
      return;
    }

    const step =
      model.playMode === PlayMode.SEQUENCE ? 1 / model.frameRate : deltaTime;

    model.deltaTime = step;
    model.clockTime = clockTime;
    model.currentTime += step;

    if (model.currentTime >= model.endTime) {
      if (model.loop) {
        const duration = model.endTime - model.startTime;
        model.currentTime =
          model.startTime + ((model.currentTime - model.startTime) % duration);
        publicAPI.initialize();
      } else {
        // the end time stays readable, so the state moves without the reset
        // that _onStateChanged would apply
        model.currentTime = model.endTime;
        model.state = SceneState.STOPPED;
      }
    }

    model.cues.forEach((cue) => cue.tick(timeForCue(cue), step, clockTime));

    publicAPI.modified();
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const SCENE_FIELDS = ['loop', 'playMode', 'frameRate'];

const DEFAULT_VALUES = {
  loop: false,
  playMode: PlayMode.REALTIME,
  frameRate: 60,
  cues: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (!model.cues) {
    model.cues = [];
  }

  // a scene is a cue, so another scene can hold it
  vtkAnimationCue.extend(publicAPI, model, initialValues);

  // Getters and setters
  macro.setGet(publicAPI, model, SCENE_FIELDS);
  macro.getArray(publicAPI, model, ['cues']);

  // Object specific methods
  vtkAnimationScene(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationScene');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
