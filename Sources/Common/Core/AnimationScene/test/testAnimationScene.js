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

it('vtkAnimationScene: Start and stop', () => {
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

  scene.tick(0, 0.5);
  expect(scene.getTime()).toBe(0.5);
  expect(cue.getTime()).toBe(0.5);

  scene.tick(0, 0.5);
  expect(scene.getTime()).toBe(1.0);
  expect(cue.getTime()).toBe(1.0);
});

it('vtkAnimationScene: Seek to time', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 3 });
  const cue1 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const cue2 = vtkAnimationCue.newInstance({ startTime: 1, endTime: 2 });

  scene.addCue(cue1);
  scene.addCue(cue2);

  scene.setAnimationTime(0.5);
  expect(scene.getTime()).toBe(0.5);

  // seeking scrubs the cues without starting them
  scene.setAnimationTime(1.5);
  expect(scene.getTime()).toBe(1.5);
  expect(cue2.isPlaying()).toBeFalsy();
  expect(cue2.getTime()).toBe(1.5);

  scene.setAnimationTime(3);
  expect(scene.getTime()).toBe(3);
});

it('vtkAnimationScene: Clamp time to range', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 1, endTime: 5 });

  scene.play();
  scene.tick(0, 10);

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
  scene.tick(0, 0.5);

  expect(cue1Ticks > 0).toBeTruthy();
  expect(cue2Ticks > 0).toBeTruthy();
});

it('vtkAnimationScene: Start and stop are no ops when redundant', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });
  scene.addCue(cue);

  expect(scene.stop()).toBeFalsy();

  expect(scene.play()).toBeTruthy();
  expect(scene.play()).toBeFalsy();

  const mtime = scene.getMTime();
  scene.play();
  expect(scene.getMTime()).toBe(mtime);

  expect(scene.stop()).toBeTruthy();
  expect(scene.stop()).toBeFalsy();
});

it('vtkAnimationScene: Pause needs a started scene', () => {
  const scene = vtkAnimationScene.newInstance();

  expect(scene.pause()).toBeFalsy();

  scene.play();
  expect(scene.pause()).toBeTruthy();
  expect(scene.pause()).toBeFalsy();
});

it('vtkAnimationScene: Resume keeps the time', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 4 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 4 });
  scene.addCue(cue);

  scene.play();
  scene.tick(0, 1.5);
  expect(scene.getTime()).toBe(1.5);

  scene.pause();
  scene.play();
  expect(scene.getTime()).toBe(1.5);
  expect(cue.isPlaying()).toBeTruthy();
});

it('vtkAnimationScene: Seek leaves a paused scene paused', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 4 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 4 });
  scene.addCue(cue);

  scene.play();
  scene.pause();

  scene.setAnimationTime(2);
  expect(scene.isPlaying()).toBeFalsy();
  expect(scene.getTime()).toBe(2);
  expect(cue.getTime()).toBe(2);
});

it('vtkAnimationScene: A scene is a cue', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });
  expect(scene.isA('vtkAnimationCue')).toBeTruthy();

  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });
  scene.addCue(cue);
  scene.play();
  expect(scene.isPlaying()).toBeTruthy();
  expect(cue.isPlaying()).toBeTruthy();

  // a scene can be nested in another scene, since it holds the cue API
  const parent = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });
  expect(parent.addCue(scene)).toBeTruthy();
  parent.start();
  parent.tick(0, 0.5);
  expect(parent.getTime()).toBe(0.5);
});

it('vtkAnimationScene: Cues are added once', () => {
  const scene = vtkAnimationScene.newInstance();
  const cue = vtkAnimationCue.newInstance();

  expect(scene.addCue(cue)).toBeTruthy();
  expect(scene.addCue(cue)).toBeFalsy();
  expect(scene.getNumberOfCues()).toBe(1);
  expect(scene.getCues().length).toBe(1);
  expect(scene.getCuesByReference().length).toBe(1);

  expect(scene.removeCue(cue)).toBeTruthy();
  expect(scene.removeCue(cue)).toBeFalsy();
});

it('vtkAnimationScene: Names and their aliases', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 4 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 4 });
  scene.addCue(cue);

  expect(scene.start()).toBeTruthy();
  expect(scene.isPlaying()).toBeTruthy();
  scene.seek(1);
  expect(scene.getAnimationTime()).toBe(1);
  expect(scene.getTime()).toBe(1);

  // the clock time travels from the scene down to every cue
  scene.tick(0, 0.5, 1234);
  expect(scene.getClockTime()).toBe(1234);
  expect(cue.getClockTime()).toBe(1234);
  expect(cue.getDeltaTime()).toBe(0.5);

  expect(scene.removeAllCues()).toBeTruthy();
  expect(scene.removeAllCues()).toBeFalsy();
  expect(scene.getNumberOfCues()).toBe(0);
});

it('vtkAnimationScene: Cues run inside their own window', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 3 });
  const early = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const late = vtkAnimationCue.newInstance({ startTime: 2, endTime: 3 });

  const started = [];
  const ended = [];
  early.onStartCueEvent(() => started.push('early'));
  late.onStartCueEvent(() => started.push('late'));
  early.onEndCueEvent(() => ended.push('early'));
  late.onEndCueEvent(() => ended.push('late'));

  scene.addCue(early);
  scene.addCue(late);
  scene.play();

  // play() reaches every cue, then the windows take over
  expect(started).toEqual(['early', 'late']);
  started.length = 0;
  ended.length = 0;
  scene.initialize();
  late.stop();
  early.stop();

  scene.tick(0, 0.5);
  expect(early.isCueStarted()).toBeTruthy();
  expect(late.isCueStarted()).toBeFalsy();

  scene.tick(0, 1);
  expect(early.getTime()).toBe(1);

  scene.tick(0, 1);
  expect(ended).toEqual(['early']);
  expect(late.isCueStarted()).toBeTruthy();
  expect(late.getTime()).toBe(2.5);
});

it('vtkAnimationScene: Normalized cues read a fraction of the scene', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 4 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  cue.setTimeModeToNormalized();

  scene.addCue(cue);
  scene.play();

  // half way through the scene is 0.5 for a normalized cue
  scene.tick(0, 2);
  expect(scene.getAnimationTime()).toBe(2);
  expect(cue.getAnimationTime()).toBe(0.5);

  scene.setAnimationTime(3);
  expect(cue.getAnimationTime()).toBe(0.75);
});

it('vtkAnimationScene: Sequence mode steps by the frame rate', () => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 1 });
  scene.setPlayModeToSequence();
  scene.setFrameRate(10);

  scene.play();

  // the reported delta is ignored, every tick is one frame
  scene.tick(0, 999);
  expect(scene.getAnimationTime()).toBeCloseTo(0.1);
  scene.tick(0, 0.001);
  expect(scene.getAnimationTime()).toBeCloseTo(0.2);
  expect(scene.getDeltaTime()).toBeCloseTo(0.1);

  scene.setPlayModeToRealTime();
  scene.tick(0, 0.3);
  expect(scene.getAnimationTime()).toBeCloseTo(0.5);
});
