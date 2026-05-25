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
  track.setBoneIndex(5);
  track.setTrackType(TrackType.ROTATION);
  track.setInterpolationMode(InterpolationMode.STEP);

  expect(track.getName()).toBe('LeftArmRotation');
  expect(track.getBoneIndex()).toBe(5);
  expect(track.getTrackType()).toBe(TrackType.ROTATION);
  expect(track.getInterpolationMode()).toBe(InterpolationMode.STEP);
});
