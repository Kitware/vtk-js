import macro from 'vtk.js/Sources/macros';
import {
  CueState,
  TimeMode,
} from 'vtk.js/Sources/Common/Core/AnimationCue/Constants';

// ---------------------------------------------------------------------------
// vtkAnimationCue methods
// ---------------------------------------------------------------------------

function vtkAnimationCue(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationCue');

  /**
   * Get the time this cue holds, on the timeline of the scene that drives it
   * @return {number}
   */
  publicAPI.getAnimationTime = () => model.currentTime;

  /** Alias of getAnimationTime() */
  publicAPI.getTime = publicAPI.getAnimationTime;

  /**
   * Get the state this cue holds
   * @return {number} One of CueState
   */
  publicAPI.getCueState = () => model.cueState;

  /** Read the start and end times as fractions of the scene duration */
  publicAPI.setTimeModeToNormalized = () =>
    publicAPI.setTimeMode(TimeMode.NORMALIZED);

  /** Read the start and end times on the timeline of the scene */
  publicAPI.setTimeModeToRelative = () =>
    publicAPI.setTimeMode(TimeMode.RELATIVE);

  /**
   * True when an uninitialized cue reaches its start time
   * @param {number} time
   * @return {boolean}
   */
  publicAPI.checkStartCue = (time) =>
    time >= model.startTime && model.cueState === CueState.UNINITIALIZED;

  /**
   * True once the given time reaches the end of an active cue window.
   * @param {number} time
   * @return {boolean}
   */
  publicAPI.checkEndCue = (time) =>
    time >= model.endTime && model.cueState === CueState.ACTIVE;

  /**
   * True while the cue runs, that is between the two checks above
   * @return {boolean}
   */
  publicAPI.isCueStarted = () => model._started;

  function startCue() {
    if (model._started) {
      return;
    }
    model._started = true;
    model._paused = false;
    model.cueState = CueState.ACTIVE;
    model._onStartCue();
    publicAPI.invokeStartCueEvent({ time: model.currentTime });
  }

  function endCue() {
    if (!model._started) {
      return;
    }
    model._started = false;
    model._paused = false;
    model.cueState = CueState.INACTIVE;
    model.currentTime = model.endTime;
    model._onEndCue();
    publicAPI.invokeEndCueEvent({ time: model.currentTime });
  }

  /**
   * Reset the cue to UNINITIALIZED for another run.
   */
  publicAPI.initialize = () => {
    const changed =
      model._started ||
      model._paused ||
      model.cueState !== CueState.UNINITIALIZED;
    model._started = false;
    model._paused = false;
    model.cueState = CueState.UNINITIALIZED;
    if (changed) {
      publicAPI.modified();
    }
  };

  /**
   * End a running cue without waiting for the time to leave its window.
   */
  publicAPI.finalize = () => {
    endCue();
  };

  /**
   * Start playing the cue
   */
  publicAPI.play = () => {
    if (model.cueState === CueState.ACTIVE && !model._paused) {
      return;
    }
    // a paused cue continues from the time it holds, any idle cue starts over
    if (model.cueState !== CueState.ACTIVE) {
      model.currentTime = model.startTime;
    }
    startCue();
    model._paused = false;
    publicAPI.modified();
  };

  /**
   * Pause the cue
   */
  publicAPI.pause = () => {
    if (model.cueState === CueState.ACTIVE && !model._paused) {
      model._paused = true;
      publicAPI.modified();
    }
  };

  /**
   * Stop and reset the cue
   */
  publicAPI.stop = () => {
    // an inactive cue may still hold its end time and need resetting
    const changed =
      model.cueState !== CueState.INACTIVE ||
      model.currentTime !== model.startTime ||
      model._paused;
    if (model._started) {
      model._started = false;
      model._onEndCue();
      publicAPI.invokeEndCueEvent({ time: model.currentTime });
    }
    model._paused = false;
    model.cueState = CueState.INACTIVE;
    model.currentTime = model.startTime;
    if (changed) {
      publicAPI.modified();
    }
  };

  /**
   * Check if cue is active (playing or paused)
   * @return {boolean}
   */
  publicAPI.isActive = () => model.cueState === CueState.ACTIVE;

  /**
   * Check if cue is playing
   * @return {boolean}
   */
  publicAPI.isPlaying = () =>
    model.cueState === CueState.ACTIVE && !model._paused;

  /**
   * Move to a time inside the cue and report it without changing its state.
   * @param {number} time Time within the cue, clamped to its bounds
   */
  publicAPI.setAnimationTime = (time) => {
    const clamped = Math.max(model.startTime, Math.min(time, model.endTime));
    if (clamped === model.currentTime) {
      return;
    }
    model.currentTime = clamped;
    model.deltaTime = 0;
    model._onTickCue(clamped, 0, model.clockTime);
    publicAPI.invokeTickEvent({
      time: model.currentTime,
      deltaTime: 0,
      clockTime: model.clockTime,
    });
    publicAPI.modified();
  };

  /** Alias of setAnimationTime() */
  publicAPI.seek = publicAPI.setAnimationTime;

  /**
   * Advance the cue to the time the scene reports. An UNINITIALIZED cue enters
   * its window on its own; an INACTIVE cue ignores subsequent ticks.
   * @param {number} currentTime Time the scene holds now
   * @param {number} deltaTime Length of this step
   * @param {number} [clockTime] Wall clock time, reported by getClockTime()
   */
  publicAPI.tick = (currentTime, deltaTime, clockTime = 0) => {
    if (model._paused || model.cueState === CueState.INACTIVE) {
      return;
    }

    // the checks read the time the scene reports, the cue holds it clamped
    const clamped = Math.max(
      model.startTime,
      Math.min(currentTime, model.endTime)
    );

    if (!model._started) {
      if (!publicAPI.checkStartCue(currentTime)) {
        return;
      }
      // the time lands before the start event, so a listener reads it
      model.currentTime = clamped;
      startCue();
    }

    if (model.cueState === CueState.ACTIVE && currentTime <= model.endTime) {
      model.currentTime = clamped;
      model.deltaTime = deltaTime;
      model.clockTime = clockTime;

      model._onTickCue(model.currentTime, deltaTime, clockTime);
      publicAPI.invokeTickEvent({
        time: model.currentTime,
        deltaTime,
        clockTime,
      });
    }

    if (publicAPI.checkEndCue(currentTime)) {
      endCue();
    }

    publicAPI.modified();
  };

  // a subclass overrides these
  model._onStartCue = () => {};
  model._onTickCue = () => {};
  model._onEndCue = () => {};

  macro.event(publicAPI, model, 'startCueEvent');
  macro.event(publicAPI, model, 'tickEvent');
  macro.event(publicAPI, model, 'endCueEvent');
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const CUE_FIELDS = ['startTime', 'endTime', 'timeMode'];

const DEFAULT_VALUES = {
  startTime: 0,
  endTime: 1,
  currentTime: 0,
  deltaTime: 0,
  clockTime: 0,
  timeMode: TimeMode.RELATIVE,
  cueState: CueState.UNINITIALIZED,
  _started: false,
  _paused: false,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, CUE_FIELDS);
  macro.get(publicAPI, model, ['deltaTime', 'clockTime']);

  // Object specific methods
  vtkAnimationCue(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationCue');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
