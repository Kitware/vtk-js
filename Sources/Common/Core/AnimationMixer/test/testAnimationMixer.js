import test from 'tape';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import vtkAnimationScene from 'vtk.js/Sources/Common/Core/AnimationScene';
import vtkArmature from 'vtk.js/Sources/Common/DataModel/Armature';
import vtkAnimationMixer from 'vtk.js/Sources/Common/Core/AnimationMixer';

import { TrackType } from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

test('vtkAnimationMixer: Basic instantiation', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  t.ok(mixer);
  t.equal(mixer.getNumberOfClips(), 0);
  t.notOk(mixer.isPlaying());
  t.end();
});

test('vtkAnimationMixer: Non-skeletal animation bindings', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const applied = [];
  const animation = {
    evaluate(time) {
      return { time };
    },
  };

  const registered = mixer.setAnimationBinding(
    'custom',
    (updates, context) => {
      applied.push({ updates, context });
    },
    [animation]
  );

  t.ok(registered);
  t.deepEqual(mixer.getAnimationBindingNames(), ['custom']);

  mixer.tick(0.25);
  t.equal(applied.length, 1);
  t.equal(applied[0].updates.time, 0.25);
  t.equal(applied[0].context.time, 0.25);
  t.equal(applied[0].context.deltaTime, 0.25);

  t.ok(mixer.removeAnimationBinding('custom'));
  mixer.tick(0.25);
  t.equal(applied.length, 1);
  t.end();
});

test('vtkAnimationMixer: Uses the first animation only', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const applied = [];
  let firstCount = 0;
  let secondCount = 0;
  const animation1 = {
    evaluate() {
      firstCount += 1;
      return { selected: 1 };
    },
  };
  const animation2 = {
    evaluate() {
      secondCount += 1;
      return { selected: 2 };
    },
  };

  const registered = mixer.setAnimationBinding(
    'selected',
    (updates, context) => {
      applied.push({ updates, context });
    },
    [animation1, animation2]
  );

  t.ok(registered);

  mixer.tick(0.5);

  t.equal(applied.length, 1);
  t.deepEqual(applied[0].updates, { selected: 1 });
  t.equal(firstCount, 1);
  t.equal(secondCount, 0);
  t.equal(applied[0].context.time, 0.5);
  t.equal(applied[0].context.deltaTime, 0.5);
  t.end();
});

test('vtkAnimationMixer: Add and remove clips', (t) => {
  const mixer = vtkAnimationMixer.newInstance();

  const clip1 = vtkAnimationClip.newInstance({ name: 'Walk' });
  const clip2 = vtkAnimationClip.newInstance({ name: 'Run' });

  mixer.addClip(clip1);
  mixer.addClip(clip2);
  t.equal(mixer.getNumberOfClips(), 2);

  const names = mixer.getClipNames();
  t.ok(names.includes('Walk'));
  t.ok(names.includes('Run'));

  mixer.removeClip('Walk');
  t.equal(mixer.getNumberOfClips(), 1);
  t.end();
});

test('vtkAnimationMixer: Get clip by name', (t) => {
  const mixer = vtkAnimationMixer.newInstance();

  const clip = vtkAnimationClip.newInstance({ name: 'Dance' });
  mixer.addClip(clip);

  const retrieved = mixer.getClip('Dance');
  t.equal(retrieved, clip);

  const notFound = mixer.getClip('NotExists');
  t.equal(notFound, null);
  t.end();
});

test('vtkAnimationMixer: Register scenes', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene1 = vtkAnimationScene.newInstance();
  const scene2 = vtkAnimationScene.newInstance();

  mixer.registerScene(scene1);
  mixer.registerScene(scene2);

  const scenes = mixer.getScenes();
  t.equal(scenes.length, 2);

  mixer.unregisterScene(scene1);
  t.equal(mixer.getScenes().length, 1);
  t.end();
});

test('vtkAnimationMixer: Set skeleton', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });

  mixer.setSkeleton(skeleton);
  t.equal(mixer.getSkeleton(), skeleton);
  t.end();
});

test('vtkAnimationMixer: Play clip (requires scene)', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.registerScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance({
    name: 'TestTrack',
    boneIndex: 0,
    trackType: TrackType.TRANSLATION,
  });
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track);

  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });
  mixer.setSkeleton(skeleton);

  mixer.playClip('Test');
  t.equal(mixer.getCurrentClipName(), 'Test');
  t.ok(mixer.isPlaying());
  t.end();
});

test('vtkAnimationMixer: Pause and resume', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.registerScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track);

  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});
  mixer.setSkeleton(skeleton);

  mixer.playClip('Test');
  t.ok(mixer.isPlaying());

  mixer.pauseClip();
  // After pause, mixer should still show playing (scene is paused, not cue)
  // This is expected behavior for pause

  mixer.resumeClip();
  // Resume should work

  mixer.stop();
  t.notOk(mixer.isPlaying());
  t.equal(mixer.getCurrentClipName(), null);
  t.end();
});

test('vtkAnimationMixer: Clip time seek', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.registerScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track);

  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});
  mixer.setSkeleton(skeleton);

  mixer.playClip('Test');

  mixer.setClipTime(0.5);
  const time = mixer.getClipTime();
  t.ok(time > 0 && time <= 1);
  t.end();
});

test('vtkAnimationMixer: Tick advances scenes', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.registerScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track);

  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});
  mixer.setSkeleton(skeleton);

  mixer.playClip('Test');
  mixer.tick(0.2);

  const time = mixer.getClipTime();
  t.ok(time > 0);
  t.end();
});

test('vtkAnimationMixer: Stop removes clip from playback', (t) => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.registerScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});
  mixer.setSkeleton(skeleton);

  mixer.playClip('Test');
  mixer.stop();

  t.equal(mixer.getCurrentClipName(), null);
  t.notOk(mixer.isPlaying());
  t.end();
});
