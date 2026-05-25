import { it, expect } from 'vitest';
import vtkAnimationCue from 'vtk.js/Sources/Common/Core/AnimationCue';
import vtkAnimationScene from 'vtk.js/Sources/Common/Core/AnimationScene';

it('vtkAnimationScene: Basic instantiation', () => {
  const scene = vtkAnimationScene.newInstance();
  expect(scene).toBeTruthy();
  expect(scene.getNumberOfCues()).toBe(0);
  expect(scene.getTime()).toBe(0);
});

it('vtkAnimationScene: Add and remove cues', () => {
  const scene = vtkAnimationScene.newInstance();

  const cue1 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const cue2 = vtkAnimationCue.newInstance({ startTime: 1, endTime: 2 });

  scene.addCue(cue1);
  scene.addCue(cue2);
  expect(scene.getNumberOfCues()).toBe(2);

  scene.removeCue(cue1);
  expect(scene.getNumberOfCues()).toBe(1);
  expect(scene.getCue(0)).toBe(cue2);
});

it('vtkAnimationScene: Play and stop', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });

  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });
  scene.addCue(cue);

  expect(scene.isPlaying()).toBeFalsy();

  scene.play();
  expect(scene.isPlaying()).toBeTruthy();
  expect(cue.isPlaying()).toBeTruthy();
  expect(scene.getTime()).toBe(0);

  scene.stop();
  expect(scene.isPlaying()).toBeFalsy();
  expect(cue.isPlaying()).toBeFalsy();
  expect(scene.getTime()).toBe(0);
});

it('vtkAnimationScene: Pause and resume', () => {
  const scene = vtkAnimationScene.newInstance();
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  scene.addCue(cue);
  scene.play();
  expect(cue.isPlaying()).toBeTruthy();

  scene.pause();
  expect(cue.isPlaying()).toBeFalsy();

  scene.play();
  expect(cue.isPlaying()).toBeTruthy();
});

it('vtkAnimationScene: Tick advances cues', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  scene.addCue(cue);
  scene.play();

  scene.tick(0.5);
  expect(scene.getTime()).toBe(0.5);
  expect(cue.getTime()).toBe(0.5);

  scene.tick(0.5);
  expect(scene.getTime()).toBe(1.0);
  expect(cue.getTime()).toBe(1.0);
});

it('vtkAnimationScene: Seek to time', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 3 });
  const cue1 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const cue2 = vtkAnimationCue.newInstance({ startTime: 1, endTime: 2 });

  scene.addCue(cue1);
  scene.addCue(cue2);

  scene.seek(0.5);
  expect(scene.getTime()).toBe(0.5);

  scene.seek(1.5);
  expect(scene.getTime()).toBe(1.5);
  expect(cue2.isPlaying()).toBeTruthy();

  scene.seek(3);
  expect(scene.getTime()).toBe(3);
});

it('vtkAnimationScene: Clamp time to range', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 1, endTime: 5 });

  scene.play();
  scene.tick(10);

  expect(scene.getTime()).toBe(5);
  expect(scene.isPlaying()).toBeFalsy();
});

it('vtkAnimationScene: Multiple cues', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });

  const cue1 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const cue2 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let cue1Ticks = 0;
  let cue2Ticks = 0;

  cue1.onTickEvent(() => cue1Ticks++);
  cue2.onTickEvent(() => cue2Ticks++);

  scene.addCue(cue1);
  scene.addCue(cue2);

  scene.play();
  scene.tick(0.5);

  expect(cue1Ticks > 0).toBeTruthy();
  expect(cue2Ticks > 0).toBeTruthy();
});
