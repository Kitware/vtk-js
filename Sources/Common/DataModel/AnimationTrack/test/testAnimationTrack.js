import test from 'tape';
import vtkAnimationTrack from '../index';
import { InterpolationMode, TrackType } from '../Constants';

test('vtkAnimationTrack: Basic instantiation', (t) => {
  const track = vtkAnimationTrack.newInstance();
  t.ok(track);
  t.equal(track.getNumberOfKeyframes(), 0);
  t.equal(track.getDuration(), 0);
  t.end();
});

test('vtkAnimationTrack: Add keyframes', (t) => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 0, 0]);
  track.addKeyframe(2, [2, 0, 0]);

  t.equal(track.getNumberOfKeyframes(), 3);
  t.equal(track.getDuration(), 2);
  t.end();
});

test('vtkAnimationTrack: Get keyframe by index', (t) => {
  const track = vtkAnimationTrack.newInstance();

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);

  t.equal(track.getKeyframeTime(0), 0);
  t.equal(track.getKeyframeTime(1), 1);

  const val0 = track.getKeyframeValue(0);
  t.equal(val0[0], 0);

  const val1 = track.getKeyframeValue(1);
  t.equal(val1[0], 1);
  t.end();
});

test('vtkAnimationTrack: STEP interpolation', (t) => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.STEP,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [2, 2, 2]);

  const val0 = track.evaluate(0);
  t.equal(val0[0], 0);

  const val1 = track.evaluate(1); // Between keyframes, should be step (first value)
  t.equal(val1[0], 0);

  const val2 = track.evaluate(2);
  t.equal(val2[0], 2);
  t.end();
});

test('vtkAnimationTrack: LINEAR interpolation (translation)', (t) => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [2, 0, 0]);

  const val0 = track.evaluate(0);
  t.equal(val0[0], 0);

  const val1 = track.evaluate(1); // Midpoint
  t.equal(val1[0], 1); // Linear interpolation

  const val2 = track.evaluate(2);
  t.equal(val2[0], 2);
  t.end();
});

test('vtkAnimationTrack: Quaternion SLERP (rotation)', (t) => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.ROTATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  // Quaternion [x, y, z, w] = identity
  track.addKeyframe(0, [0, 0, 0, 1]);
  // Quaternion rotated 180 around Z
  track.addKeyframe(2, [0, 0, 1, 0]);

  const val0 = track.evaluate(0);
  t.equal(val0[3], 1); // Identity w

  const val2 = track.evaluate(2);
  t.equal(val2[2], 1); // Rotated Z

  // Midpoint should interpolate (SLERP)
  const val1 = track.evaluate(1);
  t.ok(val1.length === 4);
  t.end();
});

test('vtkAnimationTrack: Clamp outside range', (t) => {
  const track = vtkAnimationTrack.newInstance({
    trackType: TrackType.TRANSLATION,
    interpolationMode: InterpolationMode.LINEAR,
  });

  track.addKeyframe(1, [1, 1, 1]);
  track.addKeyframe(3, [3, 3, 3]);

  // Before first keyframe
  const valBefore = track.evaluate(0);
  t.equal(valBefore[0], 1);

  // After last keyframe
  const valAfter = track.evaluate(5);
  t.equal(valAfter[0], 3);
  t.end();
});

test('vtkAnimationTrack: Clear keyframes', (t) => {
  const track = vtkAnimationTrack.newInstance();

  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  t.equal(track.getNumberOfKeyframes(), 2);

  track.clear();
  t.equal(track.getNumberOfKeyframes(), 0);
  t.equal(track.getDuration(), 0);
  t.end();
});

test('vtkAnimationTrack: Track properties', (t) => {
  const track = vtkAnimationTrack.newInstance();

  track.setName('LeftArmRotation');
  track.setBoneIndex(5);
  track.setTrackType(TrackType.ROTATION);
  track.setInterpolationMode(InterpolationMode.STEP);

  t.equal(track.getName(), 'LeftArmRotation');
  t.equal(track.getBoneIndex(), 5);
  t.equal(track.getTrackType(), TrackType.ROTATION);
  t.equal(track.getInterpolationMode(), InterpolationMode.STEP);
  t.end();
});
