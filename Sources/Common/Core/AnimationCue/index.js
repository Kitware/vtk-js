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
   * Get the time step of the last tick
   * @return {number}
   */
  publicAPI.getDeltaTime = () => model.deltaTime;

  /**
   * Get the wall clock time the last tick reported
   * @return {number}
   */
  publicAPI.getClockTime = () => model.clockTime;

  /**
   * Get the state this cue holds
   * @return {number} One of CueState
   */
  publicAPI.getCueState = () => model.state;

  /** Read the start and end times as fractions of the scene duration */
  publicAPI.setTimeModeToNormalized = () =>
    publicAPI.setTimeMode(TimeMode.NORMALIZED);

  /** Read the start and end times on the timeline of the scene */
  publicAPI.setTimeModeToRelative = () =>
    publicAPI.setTimeMode(TimeMode.RELATIVE);

  /**
   * True once the given time reaches the start of the cue window
   * @param {number} time
   * @return {boolean}
   */
  publicAPI.checkStartCue = (time) => time >= model.startTime;

  /**
   * True once the given time passes the end of the cue window. The cue still
   * runs at exactly the end time, and ends on the first time beyond it.
   * @param {number} time
   * @return {boolean}
   */
  publicAPI.checkEndCue = (time) => time > model.endTime;

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
    model._finished = false;
    model._onStartCue();
    publicAPI.invokeStartCueEvent({ time: model.currentTime });
  }

  function endCue() {
    if (!model._started) {
      return;
    }
    model._started = false;
    model._finished = true;
    model.state = CueState.STOPPED;
    model.currentTime = model.endTime;
    model._onEndCue();
    publicAPI.invokeEndCueEvent({ time: model.currentTime });
  }

  /**
   * Arm the cue for another run, so a cue that reached its end time starts
   * again the next time a scene ticks it into its window.
   */
  publicAPI.initialize = () => {
    model._started = false;
    model._finished = false;
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
    if (model.state === CueState.PLAYING) {
      return;
    }
    // a paused cue continues from the time it holds, a stopped cue starts over
    if (model.state === CueState.STOPPED) {
      model.currentTime = model.startTime;
      model._finished = false;
    }
    model.state = CueState.PLAYING;
    startCue();
    publicAPI.modified();
  };

  /**
   * Pause the cue
   */
  publicAPI.pause = () => {
    if (model.state === CueState.PLAYING) {
      model.state = CueState.PAUSED;
      publicAPI.modified();
    }
  };

  /**
   * Stop and reset the cue
   */
  publicAPI.stop = () => {
    // a cue that reached its end time is already stopped but still holds that
    // end time, so the reset has to run before the state test short circuits
    const changed =
      model.state !== CueState.STOPPED || model.currentTime !== model.startTime;
    if (model._started) {
      model._started = false;
      model._onEndCue();
      publicAPI.invokeEndCueEvent({ time: model.currentTime });
    }
    model._finished = false;
    model.state = CueState.STOPPED;
    model.currentTime = model.startTime;
    if (changed) {
      publicAPI.modified();
    }
  };

  /**
   * Check if cue is active (playing or paused)
   * @return {boolean}
   */
  publicAPI.isActive = () => model.state !== CueState.STOPPED;

  /**
   * Check if cue is playing
   * @return {boolean}
   */
  publicAPI.isPlaying = () => model.state === CueState.PLAYING;

  /**
   * Move to a time inside the cue and report it, whatever the state is. A
   * paused or stopped cue stays paused or stopped.
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
   * Advance the cue to the time the scene reports. The cue enters and leaves
   * its own window on its own, so a scene only has to hand every cue the same
   * time.
   * @param {number} currentTime Time the scene holds now
   * @param {number} deltaTime Length of this step
   * @param {number} [clockTime] Wall clock time, reported by getClockTime()
   */
  publicAPI.tick = (currentTime, deltaTime, clockTime = 0) => {
    if (model.state === CueState.PAUSED) {
      return;
    }

    // the checks read the time the scene reports, the cue holds it clamped
    const clamped = Math.max(
      model.startTime,
      Math.min(currentTime, model.endTime)
    );

    if (!model._started) {
      if (model._finished || !publicAPI.checkStartCue(currentTime)) {
        return;
      }
      // the time lands before the start event, so a listener reads it
      model.currentTime = clamped;
      model.state = CueState.PLAYING;
      startCue();
    }

    if (publicAPI.checkEndCue(currentTime)) {
      endCue();
      publicAPI.modified();
      return;
    }

    model.currentTime = clamped;
    model.deltaTime = deltaTime;
    model.clockTime = clockTime;

    model._onTickCue(model.currentTime, deltaTime, clockTime);
    publicAPI.invokeTickEvent({
      time: model.currentTime,
      deltaTime,
      clockTime,
    });

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
  state: CueState.STOPPED,
  _started: false,
  _finished: false,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, CUE_FIELDS);

  // Object specific methods
  vtkAnimationCue(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationCue');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
