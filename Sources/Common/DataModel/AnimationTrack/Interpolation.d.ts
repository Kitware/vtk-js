/**
 * Find the keyframe interval index `k` such that
 * `times[k] <= t < times[k + 1]`, using binary search.
 *
 * The caller is expected to have already handled the out-of-range cases
 * (`t <= times[0]` and `t >= times[last]`); this returns a valid interval in
 * `[0, times.length - 2]`.
 *
 * @param {ArrayLike<number>} times Sorted ascending keyframe times.
 * @param {number} t Query time.
 * @param {number} [hint] Last returned index; checked first so monotonic
 *   playback stays O(1).
 * @return {number} Interval start index.
 */
export declare function findKeyframeInterval(
  times: ArrayLike<number>,
  t: number,
  hint?: number
): number;

/**
 * Cubic Hermite spline evaluation for a single scalar component, matching the
 * glTF CUBICSPLINE convention where tangents are scaled by the segment delta.
 *
 * @param {number} p0 Value at the start keyframe.
 * @param {number} p1 Value at the end keyframe.
 * @param {number} m0 Out-tangent at the start keyframe (unscaled).
 * @param {number} m1 In-tangent at the end keyframe (unscaled).
 * @param {number} alpha Normalized position within the segment [0, 1].
 * @param {number} dt Segment duration (time1 - time0).
 * @return {number} Interpolated scalar.
 */
export declare function hermite(
  p0: number,
  p1: number,
  m0: number,
  m1: number,
  alpha: number,
  dt: number
): number;

declare const _default: {
  findKeyframeInterval: typeof findKeyframeInterval;
  hermite: typeof hermite;
};
export default _default;
