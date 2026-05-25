import { it, expect } from 'vitest';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import { TrackType } from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

it('vtkAnimationClip: Basic instantiation', () => {
  const clip = vtkAnimationClip.newInstance();
  expect(clip).toBeTruthy();
  expect(clip.getNumberOfTracks()).toBe(0);
  expect(clip.getDuration()).toBe(0);
});

it('vtkAnimationClip: Add tracks', () => {
  const clip = vtkAnimationClip.newInstance({ name: 'Walk' });

  const track1 = vtkAnimationTrack.newInstance({
    name: 'LeftLeg',
    trackType: TrackType.ROTATION,
  });
  track1.addKeyframe(0, [0, 0, 0, 1]);
  track1.addKeyframe(1, [0, 0, 0.3, 0.95]);

  const track2 = vtkAnimationTrack.newInstance({
    name: 'RightLeg',
    trackType: TrackType.ROTATION,
  });
  track2.addKeyframe(0, [0, 0, 0, 1]);
  track2.addKeyframe(2, [0, 0, 0.3, 0.95]);

  clip.addTrack(track1);
  clip.addTrack(track2);

  expect(clip.getNumberOfTracks()).toBe(2);
  expect(clip.getDuration()).toBe(2); // Longest track duration
});

it('vtkAnimationClip: Get tracks', () => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Track1' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Track2' });

  clip.addTrack(track1);
  clip.addTrack(track2);

  const retrieved1 = clip.getTrack(0);
  const retrieved2 = clip.getTrack(1);

  expect(retrieved1.getName()).toBe('Track1');
  expect(retrieved2.getName()).toBe('Track2');
});

it('vtkAnimationClip: Get track by name', () => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Rotation' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Translation' });

  clip.addTrack(track1);
  clip.addTrack(track2);

  const found1 = clip.getTrackByName('Rotation');
  const found2 = clip.getTrackByName('Translation');
  const notFound = clip.getTrackByName('NotExists');

  expect(found1.getName()).toBe('Rotation');
  expect(found2.getName()).toBe('Translation');
  expect(notFound).toBe(null);
});

it('vtkAnimationClip: Remove track', () => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Track1' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Track2' });

  clip.addTrack(track1);
  clip.addTrack(track2);
  expect(clip.getNumberOfTracks()).toBe(2);

  clip.removeTrack(0);
  expect(clip.getNumberOfTracks()).toBe(1);
  expect(clip.getTrack(0).getName()).toBe('Track2');
});

it('vtkAnimationClip: Duration calculation', () => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance();
  track1.addKeyframe(0, [0, 0, 0]);
  track1.addKeyframe(3, [1, 1, 1]);

  const track2 = vtkAnimationTrack.newInstance();
  track2.addKeyframe(0, [0, 0, 0]);
  track2.addKeyframe(5, [1, 1, 1]);

  clip.addTrack(track1);
  expect(clip.getDuration()).toBe(3);

  clip.addTrack(track2);
  expect(clip.getDuration()).toBe(5); // Updated to longest

  clip.removeTrack(1);
  expect(clip.getDuration()).toBe(3); // Back to first track's duration
});

it('vtkAnimationClip: Clear tracks', () => {
  const clip = vtkAnimationClip.newInstance();

  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [1, 1, 1]);

  clip.addTrack(track);
  expect(clip.getNumberOfTracks()).toBe(1);
  expect(clip.getDuration()).toBe(2);

  clip.clear();
  expect(clip.getNumberOfTracks()).toBe(0);
  expect(clip.getDuration()).toBe(0);
});

it('vtkAnimationClip: Get all tracks', () => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Track1' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Track2' });

  clip.addTrack(track1);
  clip.addTrack(track2);

  const all = clip.getTracks();
  expect(all.length).toBe(2);
  expect(all[0].getName()).toBe('Track1');
  expect(all[1].getName()).toBe('Track2');
});
