import macro from 'vtk.js/Sources/macros';

// ---------------------------------------------------------------------------
// vtkAnimationClip methods
// ---------------------------------------------------------------------------

function vtkAnimationClip(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationClip');

  /**
   * Add an animation track to this clip
   * @param {vtkAnimationTrack} track
   */
  publicAPI.addTrack = (track) => {
    model.tracks.push(track);

    // Update duration if this track extends beyond current
    const trackDuration = track.getDuration();
    if (trackDuration > model.duration) {
      model.duration = trackDuration;
    }

    publicAPI.modified();
  };

  /**
   * Remove a track by index
   * @param {number} index
   */
  publicAPI.removeTrack = (index) => {
    if (index >= 0 && index < model.tracks.length) {
      model.tracks.splice(index, 1);

      // Recalculate duration
      model.duration = 0;
      for (const track of model.tracks) {
        if (track.getDuration() > model.duration) {
          model.duration = track.getDuration();
        }
      }

      publicAPI.modified();
    }
  };

  /**
   * Get the number of tracks in this clip
   * @return {number}
   */
  publicAPI.getNumberOfTracks = () => model.tracks.length;

  /**
   * Get a track by index
   * @param {number} index
   * @return {vtkAnimationTrack}
   */
  publicAPI.getTrack = (index) => {
    if (index >= 0 && index < model.tracks.length) {
      return model.tracks[index];
    }
    return null;
  };

  /**
   * Get all tracks
   * @return {vtkAnimationTrack[]}
   */
  publicAPI.getTracks = () => [...model.tracks];

  /**
   * Find a track by name
   * @param {string} name
   * @return {vtkAnimationTrack | null}
   */
  publicAPI.getTrackByName = (name) => {
    for (const track of model.tracks) {
      if (track.getName() === name) {
        return track;
      }
    }
    return null;
  };

  /**
   * Clear all tracks
   */
  publicAPI.clear = () => {
    model.tracks = [];
    model.duration = 0;
    publicAPI.modified();
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const CLIP_FIELDS = ['name', 'duration'];

const DEFAULT_VALUES = {
  name: '',
  duration: 0,
  tracks: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Initialize arrays
  if (!model.tracks) {
    model.tracks = [];
  }

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, CLIP_FIELDS);

  // Object specific methods
  vtkAnimationClip(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationClip');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
