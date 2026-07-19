import macro from 'vtk.js/Sources/macros';
import { CueState } from 'vtk.js/Sources/Common/Core/AnimationCue/Constants';

// ---------------------------------------------------------------------------
// vtkAnimationCue methods
// ---------------------------------------------------------------------------

function vtkAnimationCue(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationCue');

  /**
   * Get the current time within this cue
   * @return {number}
   */
  publicAPI.getTime = () => model.currentTime;

  /**
   * Start playing the cue
   */
  publicAPI.play = () => {
    model.state = CueState.PLAYING;
    model.currentTime = model.startTime;
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
    model.state = CueState.STOPPED;
    model.currentTime = model.startTime;
    publicAPI.modified();
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
   * Update the cue time and trigger tick event
   * Called by the animation scene on frame updates
   * @param {number} time - Current global time from scene
   * @param {number} deltaTime
   */
  publicAPI.tick = (time, deltaTime) => {
    if (model.state === CueState.PLAYING) {
      model.currentTime = time + deltaTime;

      // Clamp to cue bounds
      if (model.currentTime > model.endTime) {
        model.currentTime = model.endTime;
        model.state = CueState.STOPPED;
      }

      // Trigger tick event with the current time for the cue
      publicAPI.invokeTickEvent({
        cue: publicAPI,
        time: model.currentTime,
        deltaTime,
      });

      publicAPI.modified();
    }
  };

  // Add tick event
  macro.event(publicAPI, model, 'tickEvent');
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const CUE_FIELDS = ['startTime', 'endTime'];

const DEFAULT_VALUES = {
  startTime: 0,
  endTime: 1,
  currentTime: 0,
  state: CueState.STOPPED,
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
