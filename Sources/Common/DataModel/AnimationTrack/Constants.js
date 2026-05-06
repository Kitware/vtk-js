/**
 * AnimationTrack interpolation modes
 */
export const InterpolationMode = {
  STEP: 0, // Hold value until next keyframe
  LINEAR: 1, // Linear interpolation between keyframes
  CUBIC: 2, // Cubic spline (future extension)
};

/**
 * AnimationTrack target types
 */
export const TrackType = {
  TRANSLATION: 0,
  ROTATION: 1,
  SCALE: 2,
};

export default {
  InterpolationMode,
  TrackType,
};
