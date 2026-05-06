import test from 'tape';
import vtkAnimationCue from '../../AnimationCue/index';
import vtkAnimationScene from '../index';

test('vtkAnimationScene: Basic instantiation', (t) => {
  const scene = vtkAnimationScene.newInstance();
  t.ok(scene);
  t.equal(scene.getNumberOfCues(), 0);
  t.equal(scene.getTime(), 0);
  t.end();
});

test('vtkAnimationScene: Add and remove cues', (t) => {
  const scene = vtkAnimationScene.newInstance();

  const cue1 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const cue2 = vtkAnimationCue.newInstance({ startTime: 1, endTime: 2 });

  scene.addCue(cue1);
  scene.addCue(cue2);
  t.equal(scene.getNumberOfCues(), 2);

  scene.removeCue(cue1);
  t.equal(scene.getNumberOfCues(), 1);
  t.equal(scene.getCue(0), cue2);
  t.end();
});

test('vtkAnimationScene: Play and stop', (t) => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });

  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });
  scene.addCue(cue);

  t.notOk(scene.isPlaying());

  scene.play();
  t.ok(scene.isPlaying());
  t.ok(cue.isPlaying());
  t.equal(scene.getTime(), 0);

  scene.stop();
  t.notOk(scene.isPlaying());
  t.notOk(cue.isPlaying());
  t.equal(scene.getTime(), 0);
  t.end();
});

test('vtkAnimationScene: Pause and resume', (t) => {
  const scene = vtkAnimationScene.newInstance();
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  scene.addCue(cue);
  scene.play();
  t.ok(cue.isPlaying());

  scene.pause();
  t.notOk(cue.isPlaying());

  scene.play();
  t.ok(cue.isPlaying());
  t.end();
});

test('vtkAnimationScene: Tick advances cues', (t) => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 2 });
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  scene.addCue(cue);
  scene.play();

  scene.tick(0.5);
  t.equal(scene.getTime(), 0.5);
  t.equal(cue.getTime(), 0.5);

  scene.tick(0.5);
  t.equal(scene.getTime(), 1.0);
  t.equal(cue.getTime(), 1.0);
  t.end();
});

test('vtkAnimationScene: Seek to time', (t) => {
  const scene = vtkAnimationScene.newInstance({ startTime: 0, endTime: 3 });
  const cue1 = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const cue2 = vtkAnimationCue.newInstance({ startTime: 1, endTime: 2 });

  scene.addCue(cue1);
  scene.addCue(cue2);

  scene.seek(0.5);
  t.equal(scene.getTime(), 0.5);

  scene.seek(1.5);
  t.equal(scene.getTime(), 1.5);
  t.ok(cue2.isPlaying());

  scene.seek(3);
  t.equal(scene.getTime(), 3);
  t.end();
});

test('vtkAnimationScene: Clamp time to range', (t) => {
  const scene = vtkAnimationScene.newInstance({ startTime: 1, endTime: 5 });

  scene.play();
  scene.tick(10);

  t.equal(scene.getTime(), 5);
  t.notOk(scene.isPlaying());
  t.end();
});

test('vtkAnimationScene: Multiple cues', (t) => {
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

  t.ok(cue1Ticks > 0);
  t.ok(cue2Ticks > 0);
  t.end();
});
