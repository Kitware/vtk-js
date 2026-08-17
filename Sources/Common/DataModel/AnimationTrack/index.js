import macro from 'vtk.js/Sources/macros';
import { quat } from 'gl-matrix';
import {
  InterpolationMode,
  TrackType,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';
import {
  findKeyframeInterval,
  hermite,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Interpolation';

// ---------------------------------------------------------------------------
// vtkAnimationTrack methods
// ---------------------------------------------------------------------------

function vtkAnimationTrack(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAnimationTrack');

  /**
   * Index of the last keyframe at or before the given time, or -1 when every
   * keyframe comes later. Used to place a new keyframe; evaluate() goes
   * through findKeyframeInterval, which also holds a hint.
   * @param {number} time
   * @return {number}
   */
  function findKeyframeBefore(time) {
    let low = 0;
    let high = model.times.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      if (model.times[mid] <= time) {
        found = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return found;
  }

  /**
   * Add a keyframe at a specific time with a value
   * @param {number} time
   * @param {Float32Array | number[]} value
   * @param {Object} [tangents] - Optional tangents for CUBICSPLINE
   * @param {Float32Array} [tangents.inTangent]
   * @param {Float32Array} [tangents.outTangent]
   */
  publicAPI.addKeyframe = (time, value, tangents) => {
    // the times stay ascending, and a keyframe lands after the ones that hold
    // the same time
    const insertIdx = findKeyframeBefore(time) + 1;

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
   * True for an index that can address a keyframe
   * @param {number} index
   * @return {boolean}
   */
  function isKeyframeIndex(index) {
    return Number.isInteger(index) && index >= 0;
  }

  /**
   * Get keyframe time by index
   * @param {number} index A whole number, zero or more
   * @return {number | null} null when no keyframe holds that index
   */
  publicAPI.getKeyframeTime = (index) => {
    if (isKeyframeIndex(index) && index < model.times.length) {
      return model.times[index];
    }
    return null;
  };

  /**
   * Get keyframe value by index
   * @param {number} index A whole number, zero or more
   * @return {Float32Array | null} null when no keyframe holds that index
   */
  publicAPI.getKeyframeValue = (index) => {
    if (isKeyframeIndex(index) && index < model.values.length) {
      return model.values[index];
    }
    return null;
  };

  /**
   * Evaluate the track at a given time
   * Supports STEP and LINEAR interpolation
   * For rotation tracks (quaternions), uses SLERP
   * @param {number} time
   * @param {Float32Array} [out] Buffer to write into, of the same length as a
   * keyframe of this track. A caller that reads the result before it calls
   * again can pass the same buffer every frame and spare the allocation
   * @return {Float32Array} Interpolated value
   */
  publicAPI.evaluate = (time, out = null) => {
    const numKeyframes = model.times.length;

    // the buffer of the caller serves when it has the length that is wanted
    const buffer = (length) => {
      if (out && out.length === length) {
        return out;
      }
      return new Float32Array(length);
    };
    const copyOf = (source) => {
      const result = buffer(source.length);
      result.set(source);
      return result;
    };

    if (numKeyframes === 0) {
      const result = buffer(4);
      result.set([0, 0, 0, 1]); // Default quat or vec3
      return result;
    }

    // Clamp time to first-last keyframe range
    const startTime = model.times[0];
    const endTime = model.times[numKeyframes - 1];

    if (time <= startTime) {
      return copyOf(model.values[0]);
    }
    if (time >= endTime) {
      return copyOf(model.values[numKeyframes - 1]);
    }

    // the time sits inside the track, so the search gives the left keyframe
    // of the segment that holds it. the hint keeps playback in order O(1)
    const idx0 = findKeyframeInterval(model.times, time, model._intervalHint);
    model._intervalHint = idx0;
    const idx1 = idx0 + 1;

    const time0 = model.times[idx0];
    const time1 = model.times[idx1];
    const value0 = model.values[idx0];
    const value1 = model.values[idx1];

    // STEP interpolation: return value0
    if (model.interpolationMode === InterpolationMode.STEP) {
      return copyOf(value0);
    }

    // LINEAR interpolation
    if (model.interpolationMode === InterpolationMode.LINEAR) {
      const t = (time - time0) / (time1 - time0);

      // Special handling for rotation tracks (quaternion SLERP)
      if (model.trackType === TrackType.ROTATION && value0.length === 4) {
        const result = buffer(4);
        quat.slerp(result, value0, value1, t);
        return result;
      }

      // Linear interpolation for translation/scale
      const result = buffer(value0.length);
      for (let i = 0; i < value0.length; i++) {
        result[i] = value0[i] * (1 - t) + value1[i] * t;
      }
      return result;
    }

    // CUBIC (CUBICSPLINE) interpolation: Hermite spline
    if (model.interpolationMode === InterpolationMode.CUBIC) {
      const dt = time1 - time0;
      const alpha = (time - time0) / dt;

      const m0 = model.outTangents[idx0]; // out-tangent at start keyframe
      const m1 = model.inTangents[idx1]; // in-tangent at end keyframe

      const result = buffer(value0.length);
      for (let i = 0; i < value0.length; i++) {
        result[i] = hermite(
          value0[i],
          value1[i],
          m0 ? m0[i] : 0,
          m1 ? m1[i] : 0,
          alpha,
          dt
        );
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
    return copyOf(value0);
  };

  /**
   * Clear all keyframes
   * @return {boolean} true when the track held something to clear
   */
  publicAPI.clear = () => {
    if (model.times.length === 0 && model.duration === 0) {
      return false;
    }
    model.times = [];
    model.values = [];
    model.inTangents = [];
    model.outTangents = [];
    model.duration = 0;
    publicAPI.modified();
    return true;
  };
}

// ---------------------------------------------------------------------------
// Object factory
// ---------------------------------------------------------------------------

const TRACK_FIELDS = ['name', 'trackType', 'interpolationMode', 'duration'];

const DEFAULT_VALUES = {
  name: '',
  trackType: TrackType.TRANSLATION,
  interpolationMode: InterpolationMode.LINEAR,
  duration: 0,
  times: null,
  values: null,
  inTangents: null,
  outTangents: null,
  _intervalHint: 0,
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
