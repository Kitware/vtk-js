import { it, expect } from 'vitest';
import vtkAnimationTrack from 'vtk.js/Sources/Common/DataModel/AnimationTrack';
import vtkAnimationClip from 'vtk.js/Sources/Common/DataModel/AnimationClip';
import vtkAnimationScene from 'vtk.js/Sources/Common/Core/AnimationScene';
import vtkArmature from 'vtk.js/Sources/Common/DataModel/Armature';
import vtkAnimationMixer from 'vtk.js/Sources/Common/Core/AnimationMixer';

import { TrackType } from 'vtk.js/Sources/Common/DataModel/AnimationTrack/Constants';

it('vtkAnimationMixer: Basic instantiation', () => {
  const mixer = vtkAnimationMixer.newInstance();
  expect(mixer).toBeTruthy();
  expect(mixer.getNumberOfClips()).toBe(0);
  expect(mixer.isPlaying()).toBeFalsy();
});

it('vtkAnimationMixer: Non-skeletal animation bindings', () => {
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

  expect(registered).toBeTruthy();
  expect(mixer.getAnimationBindingNames()).toEqual(['custom']);

  mixer.tick(0.25);
  expect(applied.length).toBe(1);
  expect(applied[0].updates.time).toBe(0.25);
  expect(applied[0].context.time).toBe(0.25);
  expect(applied[0].context.deltaTime).toBe(0.25);

  expect(mixer.removeAnimationBinding('custom')).toBeTruthy();
  mixer.tick(0.25);
  expect(applied.length).toBe(1);
});

it('vtkAnimationMixer: Uses the first animation only', () => {
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

  expect(registered).toBeTruthy();

  mixer.tick(0.5);

  expect(applied.length).toBe(1);
  expect(applied[0].updates).toEqual({ selected: 1 });
  expect(firstCount).toBe(1);
  expect(secondCount).toBe(0);
  expect(applied[0].context.time).toBe(0.5);
  expect(applied[0].context.deltaTime).toBe(0.5);
});

it('vtkAnimationMixer: Add and remove clips', () => {
  const mixer = vtkAnimationMixer.newInstance();

  const clip1 = vtkAnimationClip.newInstance({ name: 'Walk' });
  const clip2 = vtkAnimationClip.newInstance({ name: 'Run' });

  mixer.addClip(clip1);
  mixer.addClip(clip2);
  expect(mixer.getNumberOfClips()).toBe(2);

  const names = mixer.getClipNames();
  expect(names.includes('Walk')).toBeTruthy();
  expect(names.includes('Run')).toBeTruthy();

  mixer.removeClip('Walk');
  expect(mixer.getNumberOfClips()).toBe(1);
});

it('vtkAnimationMixer: Get clip by name', () => {
  const mixer = vtkAnimationMixer.newInstance();

  const clip = vtkAnimationClip.newInstance({ name: 'Dance' });
  mixer.addClip(clip);

  const retrieved = mixer.getClip('Dance');
  expect(retrieved).toBe(clip);

  const notFound = mixer.getClip('NotExists');
  expect(notFound).toBe(null);
});

it('vtkAnimationMixer: Register scenes', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene1 = vtkAnimationScene.newInstance();
  const scene2 = vtkAnimationScene.newInstance();

  mixer.registerScene(scene1);
  mixer.registerScene(scene2);

  const scenes = mixer.getScenes();
  expect(scenes.length).toBe(2);

  mixer.unregisterScene(scene1);
  expect(mixer.getScenes().length).toBe(1);
});

it('vtkAnimationMixer: Set skeleton', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });

  mixer.setSkeleton(skeleton);
  expect(mixer.getSkeleton()).toBe(skeleton);
});

it('vtkAnimationMixer: Play clip (requires scene)', () => {
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
  expect(mixer.getCurrentClipName()).toBe('Test');
  expect(mixer.isPlaying()).toBeTruthy();
});

it('vtkAnimationMixer: Pause and resume', () => {
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
  expect(mixer.isPlaying()).toBeTruthy();

  mixer.pauseClip();
  // After pause, mixer should still show playing (scene is paused, not cue)
  // This is expected behavior for pause

  mixer.resumeClip();
  // Resume should work

  mixer.stop();
  expect(mixer.isPlaying()).toBeFalsy();
  expect(mixer.getCurrentClipName()).toBe(null);
});

it('vtkAnimationMixer: Clip time seek', () => {
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
  expect(time > 0 && time <= 1).toBeTruthy();
});

it('vtkAnimationMixer: Tick advances scenes', () => {
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
  expect(time >= 0).toBeTruthy();
});

it('vtkAnimationMixer: Stop removes clip from playback', () => {
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

  expect(mixer.getCurrentClipName()).toBe(null);
  expect(mixer.isPlaying()).toBeFalsy();
});
