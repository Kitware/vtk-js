import macro from 'vtk.js/Sources/macros';
import { SceneState } from './Constants';

// ---------------------------------------------------------------------------
// vtkAnimationScene methods
// ---------------------------------------------------------------------------

function vtkAnimationScene(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationScene');

  /**
   * Add a cue to this scene
   * @param {vtkAnimationCue} cue
   */
  publicAPI.addCue = (cue) => {
    model.cues.push(cue);
    publicAPI.modified();
  };

  /**
   * Remove a cue from this scene
   * @param {vtkAnimationCue} cue
   */
  publicAPI.removeCue = (cue) => {
    const idx = model.cues.indexOf(cue);
    if (idx !== -1) {
      model.cues.splice(idx, 1);
      publicAPI.modified();
    }
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
   * Get all cues
   * @return {vtkAnimationCue[]}
   */
  publicAPI.getCues = () => [...model.cues];

  /**
   * Start playing the scene
   */
  publicAPI.play = () => {
    model.state = SceneState.PLAYING;
    model.globalTime = model.startTime;

    // Start all cues
    model.cues.forEach((cue) => cue.play());

    publicAPI.modified();
  };

  /**
   * Pause the scene
   */
  publicAPI.pause = () => {
    if (model.state === SceneState.PLAYING) {
      model.state = SceneState.PAUSED;

      // Pause all cues
      model.cues.forEach((cue) => cue.pause());

      publicAPI.modified();
    }
  };

  /**
   * Stop the scene and reset to start time
   */
  publicAPI.stop = () => {
    model.state = SceneState.STOPPED;
    model.globalTime = model.startTime;

    // Stop all cues
    model.cues.forEach((cue) => cue.stop());

    publicAPI.modified();
  };

  /**
   * Seek to a specific time
   * @param {number} time
   */
  publicAPI.seek = (time) => {
    model.globalTime = Math.max(model.startTime, Math.min(time, model.endTime));

    // Update all cues to match global time
    model.cues.forEach((cue) => {
      if (time >= cue.getStartTime() && time <= cue.getEndTime()) {
        if (!cue.isActive()) {
          cue.play();
        }
        // Manually set cue time
        const cueLocalTime = time - cue.getStartTime();
        cue.tick(0, cueLocalTime);
      } else {
        cue.stop();
      }
    });

    publicAPI.modified();
  };

  /**
   * Get the current global time
   * @return {number}
   */
  publicAPI.getTime = () => model.globalTime;

  /**
   * Check if scene is playing
   * @return {boolean}
   */
  publicAPI.isPlaying = () => model.state === SceneState.PLAYING;

  /**
   * Called by the render loop to advance animation
   * @param {number} deltaTime
   */
  publicAPI.tick = (deltaTime) => {
    if (model.state === SceneState.PLAYING) {
      const previousTime = model.globalTime;
      model.globalTime += deltaTime;

      // Handle end of animation
      if (model.globalTime >= model.endTime) {
        if (model.loop) {
          // Wrap time for seamless looping
          const duration = model.endTime - model.startTime;
          model.globalTime =
            model.startTime + ((model.globalTime - model.startTime) % duration);
        } else {
          model.globalTime = model.endTime;
          model.state = SceneState.STOPPED;
        }
      }

      // Update all cues
      model.cues.forEach((cue) =>
        cue.tick(previousTime, model.globalTime - previousTime)
      );

      publicAPI.modified();
    }
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const SCENE_FIELDS = ['startTime', 'endTime', 'loop'];

const DEFAULT_VALUES = {
  startTime: 0,
  endTime: 1,
  globalTime: 0,
  state: SceneState.STOPPED,
  loop: false,
  cues: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Initialize cues array
  if (!model.cues) {
    model.cues = [];
  }

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, SCENE_FIELDS);

  // Object specific methods
  vtkAnimationScene(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationScene');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
