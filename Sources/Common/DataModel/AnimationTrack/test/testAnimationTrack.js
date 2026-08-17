import { it, expect } from 'vitest';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import {
  InterpolationMode,
  TrackType,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

it('vtkAnimationTrack: Basic instantiation', () => {
  const track = vtkAnimationTrack.newInstance();
  expect(track).toBeTruthy();
  expect(track.getNumberOfKeyframes()).toBe(0);
  expect(track.getDuration()).toBe(0);
});

it('vtkAnimationTrack: Add keyframes', () => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 0, 0]);
  track.addKeyframe(2, [2, 0, 0]);

  expect(track.getNumberOfKeyframes()).toBe(3);
  expect(track.getDuration()).toBe(2);
});

it('vtkAnimationTrack: Get keyframe by index', () => {
  const track = vtkAnimationTrack.newInstance();

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);

  expect(track.getKeyframeTime(0)).toBe(0);
  expect(track.getKeyframeTime(1)).toBe(1);

  const val0 = track.getKeyframeValue(0);
  expect(val0[0]).toBe(0);

  const val1 = track.getKeyframeValue(1);
  expect(val1[0]).toBe(1);
});

it('vtkAnimationTrack: STEP interpolation', () => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.STEP,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [2, 2, 2]);

  const val0 = track.evaluate(0);
  expect(val0[0]).toBe(0);

  const val1 = track.evaluate(1); // Between keyframes, should be step (first value)
  expect(val1[0]).toBe(0);

  const val2 = track.evaluate(2);
  expect(val2[0]).toBe(2);
});

it('vtkAnimationTrack: LINEAR interpolation (translation)', () => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [2, 0, 0]);

  const val0 = track.evaluate(0);
  expect(val0[0]).toBe(0);

  const val1 = track.evaluate(1); // Midpoint
  expect(val1[0]).toBe(1); // Linear interpolation

  const val2 = track.evaluate(2);
  expect(val2[0]).toBe(2);
});

it('vtkAnimationTrack: Quaternion SLERP (rotation)', () => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.ROTATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  // Quaternion [x, y, z, w] = identity
  track.addKeyframe(0, [0, 0, 0, 1]);
  // Quaternion rotated 180 around Z
  track.addKeyframe(2, [0, 0, 1, 0]);

  const val0 = track.evaluate(0);
  expect(val0[3]).toBe(1); // Identity w

  const val2 = track.evaluate(2);
  expect(val2[2]).toBe(1); // Rotated Z

  // Midpoint should interpolate (SLERP)
  const val1 = track.evaluate(1);
  expect(val1.length === 4).toBeTruthy();
});

it('vtkAnimationTrack: Clamp outside range', () => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  track.addKeyframe(1, [1, 1, 1]);
  track.addKeyframe(3, [3, 3, 3]);

  // Before first keyframe
  const valBefore = track.evaluate(0);
  expect(valBefore[0]).toBe(1);

  // After last keyframe
  const valAfter = track.evaluate(5);
  expect(valAfter[0]).toBe(3);
});

it('vtkAnimationTrack: Clear keyframes', () => {
  const track = vtkAnimationTrack.newInstance();

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  expect(track.getNumberOfKeyframes()).toBe(2);

  track.clear();
  expect(track.getNumberOfKeyframes()).toBe(0);
  expect(track.getDuration()).toBe(0);
});

it('vtkAnimationTrack: Track properties', () => {
  const track = vtkAnimationTrack.newInstance();

  track.setName('LeftArmRotation');
  track.setTrackType(TrackType.ROTATION);
  track.setInterpolationMode(InterpolationMode.STEP);

  expect(track.getName()).toBe('LeftArmRotation');
  expect(track.getTrackType()).toBe(TrackType.ROTATION);
  expect(track.getInterpolationMode()).toBe(InterpolationMode.STEP);
});

it('vtkAnimationTrack: Keyframes stay ascending whatever the insert order', () => {
  const track = vtkAnimationTrack.newInstance();

  track.addKeyframe(2, [2, 0, 0]);
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 0, 0]);
  track.addKeyframe(3, [3, 0, 0]);

  expect(track.getNumberOfKeyframes()).toBe(4);
  expect([0, 1, 2, 3].map((i) => track.getKeyframeTime(i))).toEqual([
    0, 1, 2, 3,
  ]);
  expect([0, 1, 2, 3].map((i) => track.getKeyframeValue(i)[0])).toEqual([
    0, 1, 2, 3,
  ]);
  expect(track.getDuration()).toBe(3);

  // a keyframe lands after the ones that hold the same time
  track.addKeyframe(1, [9, 0, 0]);
  expect(track.getKeyframeTime(1)).toBe(1);
  expect(track.getKeyframeTime(2)).toBe(1);
  expect(track.getKeyframeValue(1)[0]).toBe(1);
  expect(track.getKeyframeValue(2)[0]).toBe(9);
});

it('vtkAnimationTrack: An index outside the track gives null', () => {
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);

  expect(track.getKeyframeTime(0)).toBe(0);
  expect(track.getKeyframeTime(1)).toBe(null);
  expect(track.getKeyframeTime(-1)).toBe(null);
  expect(track.getKeyframeTime(0.5)).toBe(null);
  expect(track.getKeyframeValue(1)).toBe(null);
  expect(track.getKeyframeValue(-1)).toBe(null);
  expect(track.getKeyframeValue(0.5)).toBe(null);
});

it('vtkAnimationTrack: Clearing twice reports the second call did nothing', () => {
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(1, [1, 0, 0]);

  expect(track.clear()).toBeTruthy();
  const mtime = track.getMTime();
  expect(track.clear()).toBeFalsy();
  expect(track.getMTime()).toBe(mtime);
});

it('vtkAnimationTrack: Evaluate picks the right segment', () => {
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [10, 0, 0]);
  track.addKeyframe(2, [20, 0, 0]);
  track.addKeyframe(3, [30, 0, 0]);

  expect(track.evaluate(0.5)[0]).toBeCloseTo(5);
  expect(track.evaluate(1.5)[0]).toBeCloseTo(15);
  expect(track.evaluate(2.5)[0]).toBeCloseTo(25);
  expect(track.evaluate(1)[0]).toBeCloseTo(10);
});

it('vtkAnimationTrack: Evaluate can write into a buffer of the caller', () => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
  });
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [10, 20, 30]);

  const scratch = new Float32Array(3);
  const result = track.evaluate(1, scratch);
  expect(result).toBe(scratch);
  expect(Array.from(scratch)).toEqual([5, 10, 15]);

  // the same buffer serves the next call
  track.evaluate(0.5, scratch);
  expect(Array.from(scratch)).toEqual([2.5, 5, 7.5]);

  // a buffer of the wrong length is left alone
  const wrongLength = new Float32Array(4);
  expect(track.evaluate(1, wrongLength)).not.toBe(wrongLength);

  // and no buffer still returns a fresh array
  const fresh = track.evaluate(1);
  expect(fresh).not.toBe(scratch);
  expect(Array.from(fresh)).toEqual([5, 10, 15]);
});
