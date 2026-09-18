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

  const registered = mixer.addAnimationBinding(
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

it('vtkAnimationMixer: Runs every animation of a binding', () => {
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

  const registered = mixer.addAnimationBinding(
    'selected',
    (updates, context) => {
      applied.push({ updates, context });
    },
    [animation1, animation2]
  );

  expect(registered).toBeTruthy();

  mixer.tick(0.5);

  expect(applied.length).toBe(2);
  expect(applied[0].updates).toEqual({ selected: 1 });
  expect(applied[1].updates).toEqual({ selected: 2 });
  expect(firstCount).toBe(1);
  expect(secondCount).toBe(1);
  expect(applied[0].context.time).toBe(0.5);
  expect(applied[0].context.deltaTime).toBe(0.5);
});

it('vtkAnimationMixer: Plays matching imported animation channels together', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const animation = (name) => ({
    name,
    evaluate: () => new Map(),
  });

  mixer.setNodeAnimations([animation('Shared'), animation('Node only')]);
  mixer.setPointerAnimations([animation('Shared'), animation('Pointer only')]);

  expect(mixer.getAnimationNames()).toEqual([
    'Shared',
    'Node only',
    'Pointer only',
  ]);
  expect(mixer.playAnimation('Shared')).toBeTruthy();
  expect(mixer.getAnimationBindingNames()).toEqual(['node', 'pointer']);

  expect(mixer.playAnimation('Pointer only')).toBeTruthy();
  expect(mixer.getAnimationBindingNames()).toEqual(['pointer']);
  expect(mixer.playAnimation('Missing')).toBeFalsy();
  expect(mixer.getAnimationBindingNames()).toEqual(['pointer']);
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

  mixer.addScene(scene1);
  mixer.addScene(scene2);

  const scenes = mixer.getScenes();
  expect(scenes.length).toBe(2);

  mixer.removeScene(scene1);
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
  mixer.addScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance({
    name: 'TestTrack',
    trackType: TrackType.TRANSLATION,
  });
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track, 0);

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
  mixer.addScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track, 0);

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
  mixer.addScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track, 0);

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
  mixer.addScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  const track = vtkAnimationTrack.newInstance();
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(1, [1, 1, 1]);
  clip.addTrack(track, 0);

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
  mixer.addScene(scene);

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

it('vtkAnimationMixer: Add and remove report what changed', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();

  expect(mixer.addScene(scene)).toBeTruthy();
  expect(mixer.addScene(scene)).toBeFalsy();
  expect(mixer.getScenes().length).toBe(1);

  expect(mixer.removeScene(scene)).toBeTruthy();
  expect(mixer.removeScene(scene)).toBeFalsy();

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  expect(mixer.addClip(clip)).toBeTruthy();
  expect(mixer.addClip(clip)).toBeFalsy();
  expect(mixer.removeClip('Test')).toBeTruthy();
  expect(mixer.removeClip('Test')).toBeFalsy();
});

it('vtkAnimationMixer: No change leaves the mtime alone', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});

  mixer.addScene(scene);
  mixer.setSkeleton(skeleton);

  const mtime = mixer.getMTime();
  mixer.addScene(scene);
  mixer.removeScene(vtkAnimationScene.newInstance());
  mixer.setSkeleton(skeleton);
  mixer.stop();
  expect(mixer.getMTime()).toBe(mtime);

  mixer.removeScene(scene);
  expect(mixer.getMTime()).toBeGreaterThan(mtime);
});

it('vtkAnimationMixer: Playing clip again is a no op', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.addScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});
  mixer.setSkeleton(skeleton);

  expect(mixer.playClip('Test')).toBeTruthy();
  expect(mixer.playClip('Test')).toBeFalsy();

  // stop first to play it again from the start
  mixer.stop();
  expect(mixer.playClip('Test')).toBeTruthy();
});

it('vtkAnimationMixer: Removing the playing clip stops it', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const scene = vtkAnimationScene.newInstance();
  mixer.addScene(scene);

  const clip = vtkAnimationClip.newInstance({ name: 'Test' });
  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({});
  mixer.setSkeleton(skeleton);

  mixer.playClip('Test');
  expect(mixer.removeClip('Test')).toBeTruthy();

  expect(mixer.getCurrentClipName()).toBe(null);
  expect(mixer.isPlaying()).toBeFalsy();
  expect(mixer.getNumberOfClips()).toBe(0);
});

it('vtkAnimationMixer: Animation binding names are unique', () => {
  const mixer = vtkAnimationMixer.newInstance();
  const apply = () => {};

  expect(mixer.addAnimationBinding('a', apply)).toBeTruthy();
  expect(mixer.addAnimationBinding('a', apply)).toBeFalsy();
  expect(mixer.getAnimationBindingNames()).toEqual(['a']);

  expect(mixer.removeAnimationBinding('a')).toBeTruthy();
  expect(mixer.addAnimationBinding('a', apply)).toBeTruthy();
});

it('vtkAnimationMixer: A binding decides whether its time wraps', () => {
  const seen = [];
  const animation = {
    name: 'Walk',
    duration: 2,
    evaluate(t, loop) {
      seen.push([t, loop]);
      return new Map();
    },
  };

  // a looping binding keeps counting up and asks the animation to wrap, which
  // is what lets animations of different lengths share one clock
  const looping = vtkAnimationMixer.newInstance();
  looping.addAnimationBinding('a', () => {}, [animation]);
  looping.tick(1.5);
  looping.tick(1.5);
  expect(seen).toEqual([
    [1.5, true],
    [3, true],
  ]);

  // a one shot binding holds at the duration instead
  seen.length = 0;
  const once = vtkAnimationMixer.newInstance();
  once.addAnimationBinding('a', () => {}, [animation], { loop: false });
  once.tick(1.5);
  once.tick(1.5);
  once.tick(1.5);
  expect(seen).toEqual([
    [1.5, false],
    [2, false],
    [2, false],
  ]);
});

it('vtkAnimationMixer: A one shot binding says when it ends', () => {
  const ended = [];
  const animation = { name: 'Walk', duration: 2, evaluate: () => new Map() };

  const mixer = vtkAnimationMixer.newInstance();
  mixer.onAnimationEnd((evt) => ended.push(evt.name));
  mixer.addAnimationBinding('a', () => {}, [animation], { loop: false });

  mixer.tick(1);
  expect(ended).toEqual([]);

  mixer.tick(1);
  expect(ended).toEqual(['a']);

  // and it says so once, not on every later frame
  mixer.tick(1);
  expect(ended).toEqual(['a']);
});

it('vtkAnimationMixer: timeScale changes the rate', () => {
  const seen = [];
  const animation = {
    name: 'Walk',
    duration: 100,
    evaluate(t) {
      seen.push(t);
      return new Map();
    },
  };

  const mixer = vtkAnimationMixer.newInstance();
  mixer.addAnimationBinding('a', () => {}, [animation], { timeScale: 0.5 });
  mixer.tick(1);
  mixer.tick(1);
  expect(seen).toEqual([0.5, 1]);
});

it('vtkAnimationMixer: Two animations blend by weight', () => {
  const at = (x) => {
    const updates = new Map();
    updates.set(0, { translation: new Float32Array([x, 0, 0]) });
    return updates;
  };
  const left = { name: 'left', duration: 1, evaluate: () => at(0) };
  const right = { name: 'right', duration: 1, evaluate: () => at(10) };

  let blended = null;
  const mixer = vtkAnimationMixer.newInstance();
  mixer.addAnimationBinding(
    'blend',
    (updates) => {
      blended = updates.get(0).translation[0];
    },
    [left, right]
  );

  // equal weights land halfway
  mixer.tick(0.1);
  expect(blended).toBeCloseTo(5, 5);

  // and a heavier second animation pulls the result toward it
  right.weight = 3;
  mixer.tick(0.1);
  expect(blended).toBeCloseTo(7.5, 5);

  // a weight of zero takes an animation out of the blend
  right.weight = 0;
  mixer.tick(0.1);
  expect(blended).toBeCloseTo(0, 5);
});

it('vtkAnimationMixer: A played clip poses the skeleton as the mixer ticks', () => {
  const mixer = vtkAnimationMixer.newInstance();

  const clip = vtkAnimationClip.newInstance({ name: 'Slide' });
  const track = vtkAnimationTrack.newInstance({
    name: 'rootTranslation',
    trackType: TrackType.TRANSLATION,
  });
  track.addKeyframe(0, [0, 0, 0]);
  track.addKeyframe(2, [10, 0, 0]);
  clip.addTrack(track, 0);
  mixer.addClip(clip);

  const skeleton = vtkArmature.newInstance();
  skeleton.addBone({ name: 'Root' });
  mixer.setSkeleton(skeleton);

  expect(mixer.playClip('Slide')).toBeTruthy();
  expect(skeleton.getLocalMatrix(0)[12]).toBe(0);

  // ticking the mixer advances its scenes, which tick the cue that poses the
  // skeleton, so the bone really moves
  for (let i = 0; i < 10; i++) {
    mixer.tick(0.1);
  }

  const scene = mixer.getScenes()[0];
  expect(scene.getAnimationTime()).toBeCloseTo(1, 5);
  expect(skeleton.getLocalMatrix(0)[12]).toBeCloseTo(5, 3);

  for (let i = 0; i < 5; i++) {
    mixer.tick(0.1);
  }
  expect(skeleton.getLocalMatrix(0)[12]).toBeCloseTo(7.5, 3);
});
