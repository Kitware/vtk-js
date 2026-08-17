/**
 * AnimationTrack interpolation modes
 */
export declare enum InterpolationMode {
  /**
   * Hold value until next keyframe
   */
  STEP = 0,
  /**
   * Linear interpolation between keyframes
   */
  LINEAR = 1,
  /**
   * Cubic spline (future extension)
   */
  CUBIC = 2,
}

/**
 * AnimationTrack target types
 */
export declare enum TrackType {
  TRANSLATION = 0,
  ROTATION = 1,
  SCALE = 2,
}

declare const _default: {
  InterpolationMode: typeof InterpolationMode;
  TrackType: typeof TrackType;
};
export default _default;
