import macro from 'vtk.js/Sources/macros';
import { quat } from 'gl-matrix';
import { InterpolationMode, TrackType } from './Constants';

// ---------------------------------------------------------------------------
// vtkAnimationTrack methods
// ---------------------------------------------------------------------------

function vtkAnimationTrack(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationTrack');

  /**
   * Add a keyframe at a specific time with a value
   * @param {number} time
   * @param {Float32Array | number[]} value
   * @param {Object} [tangents] - Optional tangents for CUBICSPLINE
   * @param {Float32Array} [tangents.inTangent]
   * @param {Float32Array} [tangents.outTangent]
   */
  publicAPI.addKeyframe = (time, value, tangents) => {
    // Find insertion point (keep sorted by time)
    let insertIdx = 0;
    for (let i = 0; i < model.times.length; i++) {
      if (time < model.times[i]) {
        insertIdx = i;
        break;
      }
      insertIdx = i + 1;
    }

    model.times.splice(insertIdx, 0, time);

    // Store values as typed arrays for consistency
    const typedValue = new Float32Array(value);
    model.values.splice(insertIdx, 0, typedValue);

    if (tangents) {
      model.inTangents.splice(
        insertIdx,
        0,
        new Float32Array(tangents.inTangent)
      );
      model.outTangents.splice(
        insertIdx,
        0,
        new Float32Array(tangents.outTangent)
      );
    } else {
      model.inTangents.splice(insertIdx, 0, null);
      model.outTangents.splice(insertIdx, 0, null);
    }

    if (time > model.duration) {
      model.duration = time;
    }

    publicAPI.modified();
  };

  /**
   * Get number of keyframes
   * @return {number}
   */
  publicAPI.getNumberOfKeyframes = () => model.times.length;

  /**
   * Get keyframe time by index
   * @param {number} index
   * @return {number}
   */
  publicAPI.getKeyframeTime = (index) => {
    if (index >= 0 && index < model.times.length) {
      return model.times[index];
    }
    return 0;
  };

  /**
   * Get keyframe value by index
   * @param {number} index
   * @return {Float32Array}
   */
  publicAPI.getKeyframeValue = (index) => {
    if (index >= 0 && index < model.values.length) {
      return model.values[index];
    }
    return new Float32Array(0);
  };

  /**
   * Evaluate the track at a given time
   * Supports STEP and LINEAR interpolation
   * For rotation tracks (quaternions), uses SLERP
   * @param {number} time
   * @return {Float32Array} Interpolated value
   */
  publicAPI.evaluate = (time) => {
    const numKeyframes = model.times.length;

    if (numKeyframes === 0) {
      return new Float32Array([0, 0, 0, 1]); // Default quat or vec3
    }

    // Clamp time to first-last keyframe range
    const startTime = model.times[0];
    const endTime = model.times[numKeyframes - 1];

    if (time <= startTime) {
      return new Float32Array(model.values[0]);
    }
    if (time >= endTime) {
      return new Float32Array(model.values[numKeyframes - 1]);
    }

    // Find surrounding keyframes
    let idx0 = 0;
    let idx1 = 1;
    for (let i = 0; i < numKeyframes - 1; i++) {
      if (time >= model.times[i] && time <= model.times[i + 1]) {
        idx0 = i;
        idx1 = i + 1;
        break;
      }
    }

    const time0 = model.times[idx0];
    const time1 = model.times[idx1];
    const value0 = model.values[idx0];
    const value1 = model.values[idx1];

    // STEP interpolation: return value0
    if (model.interpolationMode === InterpolationMode.STEP) {
      return new Float32Array(value0);
    }

    // LINEAR interpolation
    if (model.interpolationMode === InterpolationMode.LINEAR) {
      const t = (time - time0) / (time1 - time0);

      // Special handling for rotation tracks (quaternion SLERP)
      if (model.trackType === TrackType.ROTATION && value0.length === 4) {
        const q0 = quat.fromValues(value0[0], value0[1], value0[2], value0[3]);
        const q1 = quat.fromValues(value1[0], value1[1], value1[2], value1[3]);
        const result = quat.create();
        quat.slerp(result, q0, q1, t);
        return new Float32Array(result);
      }

      // Linear interpolation for translation/scale
      const result = new Float32Array(value0.length);
      for (let i = 0; i < value0.length; i++) {
        result[i] = value0[i] * (1 - t) + value1[i] * t;
      }
      return result;
    }

    // CUBIC (CUBICSPLINE) interpolation: Hermite spline
    if (model.interpolationMode === InterpolationMode.CUBIC) {
      const dt = time1 - time0;
      const alpha = (time - time0) / dt;
      const alpha2 = alpha * alpha;
      const alpha3 = alpha2 * alpha;

      const m0 = model.outTangents[idx0]; // out-tangent at start keyframe
      const m1 = model.inTangents[idx1]; // in-tangent at end keyframe

      const result = new Float32Array(value0.length);
      for (let i = 0; i < value0.length; i++) {
        const p0 = value0[i];
        const p1 = value1[i];
        const t0Out = m0 ? m0[i] : 0;
        const t1In = m1 ? m1[i] : 0;
        result[i] =
          (2 * alpha3 - 3 * alpha2 + 1) * p0 +
          (alpha3 - 2 * alpha2 + alpha) * dt * t0Out +
          (-2 * alpha3 + 3 * alpha2) * p1 +
          (alpha3 - alpha2) * dt * t1In;
      }

      // Normalize quaternion result
      if (model.trackType === TrackType.ROTATION && value0.length === 4) {
        const len = Math.sqrt(
          result[0] ** 2 + result[1] ** 2 + result[2] ** 2 + result[3] ** 2
        );
        if (len > 0) {
          result[0] /= len;
          result[1] /= len;
          result[2] /= len;
          result[3] /= len;
        }
      }

      return result;
    }

    // Fallback
    return new Float32Array(value0);
  };

  /**
   * Clear all keyframes
   */
  publicAPI.clear = () => {
    model.times = [];
    model.values = [];
    model.inTangents = [];
    model.outTangents = [];
    model.duration = 0;
    publicAPI.modified();
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const TRACK_FIELDS = [
  'name',
  'boneIndex',
  'trackType',
  'interpolationMode',
  'duration',
];

const DEFAULT_VALUES = {
  name: '',
  boneIndex: 0,
  trackType: TrackType.TRANSLATION,
  interpolationMode: InterpolationMode.LINEAR,
  duration: 0,
  times: null,
  values: null,
  inTangents: null,
  outTangents: null,
};

// ---------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Initialize arrays
  if (!model.times) {
    model.times = [];
  }
  if (!model.values) {
    model.values = [];
  }
  if (!model.inTangents) {
    model.inTangents = [];
  }
  if (!model.outTangents) {
    model.outTangents = [];
  }

  // Object methods
  macro.obj(publicAPI, model);

  // Getters and setters
  macro.setGet(publicAPI, model, TRACK_FIELDS);

  // Object specific methods
  vtkAnimationTrack(publicAPI, model);
}

// ---------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAnimationTrack');

// ---------------------------------------------------------------------------

export default { newInstance, extend };
