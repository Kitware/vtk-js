// ---------------------------------------------------------------------------
// Shared keyframe interpolation helpers.
//
// These pure functions are used by both vtkAnimationTrack (skeletal tracks,
// per-keyframe typed arrays) and the glTF node/pointer animation evaluator
// (packed Float32Array channels) so the interpolation math stays in one place.
// ---------------------------------------------------------------------------

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
 * @param {number} [hint=0] Last returned index; checked first so monotonic
 *   playback stays O(1).
 * @return {number} Interval start index.
 */
export function findKeyframeInterval(times, t, hint = 0) {
  const n = times.length;
  if (n < 2) {
    return 0;
  }

  // Fast path for monotonic playback: the previous interval or the next one.
  if (hint >= 0 && hint < n - 1 && t >= times[hint] && t < times[hint + 1]) {
    return hint;
  }
  const next = hint + 1;
  if (next >= 0 && next < n - 1 && t >= times[next] && t < times[next + 1]) {
    return next;
  }

  // Binary search: find the last index whose time is <= t.
  let lo = 0;
  let hi = n - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (t < times[mid]) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return lo;
}

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
export function hermite(p0, p1, m0, m1, alpha, dt) {
  const a2 = alpha * alpha;
  const a3 = a2 * alpha;
  return (
    (2 * a3 - 3 * a2 + 1) * p0 +
    (a3 - 2 * a2 + alpha) * dt * m0 +
    (-2 * a3 + 3 * a2) * p1 +
    (a3 - a2) * dt * m1
  );
}

export default {
  findKeyframeInterval,
  hermite,
};
