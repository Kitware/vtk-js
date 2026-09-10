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
   * @param {number} [boneIndex] The bone the track animates, for a skeletal
   * clip. Read the tracks of a bone back with getTracksForBone().
   */
  publicAPI.addTrack = (track, boneIndex) => {
    model.tracks.push(track);

    if (Number.isInteger(boneIndex) && boneIndex >= 0) {
      const boneTracks = model.boneTracks.get(boneIndex);
      if (boneTracks) {
        boneTracks.push(track);
      } else {
        model.boneTracks.set(boneIndex, [track]);
      }
    }

    // Update duration if this track extends beyond current
    const trackDuration = track.getDuration();
    if (trackDuration > model.duration) {
      model.duration = trackDuration;
    }

    publicAPI.modified();
  };

  /**
   * Remove a track by index
   * @param {number} index A whole number, zero or more
   * @return {boolean} true when a track was removed
   */
  publicAPI.removeTrack = (index) => {
    if (!Number.isInteger(index) || index < 0 || index >= model.tracks.length) {
      return false;
    }

    const [removed] = model.tracks.splice(index, 1);

    model.boneTracks.forEach((boneTracks, boneIndex) => {
      const at = boneTracks.indexOf(removed);
      if (at !== -1) {
        boneTracks.splice(at, 1);
      }
      if (boneTracks.length === 0) {
        model.boneTracks.delete(boneIndex);
      }
    });

    if (removed.getDuration() === model.duration) {
      model.duration = model.tracks.reduce(
        (longest, track) => Math.max(longest, track.getDuration()),
        0
      );
    }

    publicAPI.modified();
    return true;
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
   * Get the tracks that animate a bone, in the order they were added
   * @param {number} boneIndex
   * @return {vtkAnimationTrack[]}
   */
  publicAPI.getTracksForBone = (boneIndex) =>
    model.boneTracks.get(boneIndex) ?? [];

  /**
   * Find a track by name
   * @param {string} name
   * @return {vtkAnimationTrack | null}
   */
  publicAPI.getTrackByName = (name) => {
    for (let i = 0; i < model.tracks.length; i++) {
      const track = model.tracks[i];
      if (track.getName() === name) {
        return track;
      }
    }
    return null;
  };

  /**
   * Clear all tracks
   * @return {boolean} true when the clip held something to clear
   */
  publicAPI.clear = () => {
    if (model.tracks.length === 0 && model.duration === 0) {
      return false;
    }
    model.tracks = [];
    model.boneTracks.clear();
    model.duration = 0;
    publicAPI.modified();
    return true;
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
  boneTracks: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Initialize arrays
  if (!model.tracks) {
    model.tracks = [];
  }
  if (!model.boneTracks) {
    model.boneTracks = new Map();
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
