import test from 'tape';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import {
  TrackType,
  InterpolationMode,
} from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

test('vtkAnimationClip: Basic instantiation', (t) => {
  const clip = vtkAnimationClip.newInstance();
  t.ok(clip);
  t.equal(clip.getNumberOfTracks(), 0);
  t.equal(clip.getDuration(), 0);
  t.end();
});

test('vtkAnimationClip: Add tracks', (t) => {
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

  t.equal(clip.getNumberOfTracks(), 2);
  t.equal(clip.getDuration(), 2); // Longest track duration
  t.end();
});

test('vtkAnimationClip: Get tracks', (t) => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Track1' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Track2' });

  clip.addTrack(track1);
  clip.addTrack(track2);

  const retrieved1 = clip.getTrack(0);
  const retrieved2 = clip.getTrack(1);

  t.equal(retrieved1.getName(), 'Track1');
  t.equal(retrieved2.getName(), 'Track2');
  t.end();
});

test('vtkAnimationClip: Get track by name', (t) => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Rotation' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Translation' });

  clip.addTrack(track1);
  clip.addTrack(track2);

  const found1 = clip.getTrackByName('Rotation');
  const found2 = clip.getTrackByName('Translation');
  const notFound = clip.getTrackByName('NotExists');

  t.equal(found1.getName(), 'Rotation');
  t.equal(found2.getName(), 'Translation');
  t.equal(notFound, null);
  t.end();
});

test('vtkAnimationClip: Remove track', (t) => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Track1' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Track2' });

  clip.addTrack(track1);
  clip.addTrack(track2);
  t.equal(clip.getNumberOfTracks(), 2);

  clip.removeTrack(0);
  t.equal(clip.getNumberOfTracks(), 1);
  t.equal(clip.getTrack(0).getName(), 'Track2');
  t.end();
});

test('vtkAnimationClip: Duration calculation', (t) => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance();
  track1.addKeyframe(0, [0, 0, 0]);
  track1.addKeyframe(3, [1, 1, 1]);

  const track2 = vtkAnimationTrack.newInstance();
  track2.addKeyframe(0, [0, 0, 0]);
  track2.addKeyframe(5, [1, 1, 1]);

  clip.addTrack(track1);
  t.equal(clip.getDuration(), 3);

  clip.addTrack(track2);
  t.equal(clip.getDuration(), 5); // Updated to longest

  clip.removeTrack(1);
  t.equal(clip.getDuration(), 3); // Back to first track's duration
  t.end();
});

test('vtkAnimationClip: Clear tracks', (t) => {
  const clip = vtkAnimationClip.newInstance();

  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [1, 1, 1]);

  clip.addTrack(track);
  t.equal(clip.getNumberOfTracks(), 1);
  t.equal(clip.getDuration(), 2);

  clip.clear();
  t.equal(clip.getNumberOfTracks(), 0);
  t.equal(clip.getDuration(), 0);
  t.end();
});

test('vtkAnimationClip: Get all tracks', (t) => {
  const clip = vtkAnimationClip.newInstance();

  const track1 = vtkAnimationTrack.newInstance({ name: 'Track1' });
  const track2 = vtkAnimationTrack.newInstance({ name: 'Track2' });

  clip.addTrack(track1);
  clip.addTrack(track2);

  const all = clip.getTracks();
  t.equal(all.length, 2);
  t.equal(all[0].getName(), 'Track1');
  t.equal(all[1].getName(), 'Track2');
  t.end();
});
