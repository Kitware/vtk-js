import test from 'tape';
import vtkAnimationCue from '../index';
import { CueState } from '../Constants';

test('vtkAnimationCue: Basic instantiation', (t) => {
  const cue = vtkAnimationCue.newInstance();
  t.ok(cue);
  t.equal(cue.getStartTime(), 0);
  t.equal(cue.getEndTime(), 1);
  t.equal(cue.getTime(), 0);
  t.end();
});

test('vtkAnimationCue: Start and end times', (t) => {
  const cue = vtkAnimationCue.newInstance({ startTime: 1, endTime: 5 });
  t.equal(cue.getStartTime(), 1);
  t.equal(cue.getEndTime(), 5);

  cue.setStartTime(2);
  cue.setEndTime(8);
  t.equal(cue.getStartTime(), 2);
  t.equal(cue.getEndTime(), 8);
  t.end();
});

test('vtkAnimationCue: Play, pause, stop', (t) => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  t.notOk(cue.isActive());
  t.notOk(cue.isPlaying());

  cue.play();
  t.ok(cue.isActive());
  t.ok(cue.isPlaying());
  t.equal(cue.getTime(), 0);

  cue.pause();
  t.ok(cue.isActive());
  t.notOk(cue.isPlaying());

  cue.play();
  t.ok(cue.isPlaying());

  cue.stop();
  t.notOk(cue.isActive());
  t.equal(cue.getTime(), 0);
  t.end();
});

test('vtkAnimationCue: Tick updates time while playing', (t) => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 5 });

  cue.play();
  cue.tick(0, 0.5);
  t.equal(cue.getTime(), 0.5);

  cue.tick(0.5, 0.5);
  t.equal(cue.getTime(), 1.0);

  // Not playing, tick should not update
  cue.pause();
  cue.tick(1.0, 0.5);
  t.equal(cue.getTime(), 1.0);
  t.end();
});

test('vtkAnimationCue: Tick clamps to end time', (t) => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let tickEventCalled = false;
  let finalTime = 0;

  cue.onTickEvent((evt) => {
    tickEventCalled = true;
    finalTime = evt.time;
  });

  cue.play();

  // Tick that goes beyond end time
  cue.tick(0, 2.5);

  t.equal(cue.getTime(), 2); // Clamped to end time
  t.notOk(cue.isPlaying()); // Should stop after reaching end
  t.ok(tickEventCalled);
  t.equal(finalTime, 2);
  t.end();
});

test('vtkAnimationCue: Tick event callback', (t) => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let eventData = null;
  cue.onTickEvent((evt) => {
    eventData = evt;
  });

  cue.play();
  cue.tick(0, 0.5);

  t.ok(eventData);
  t.equal(eventData.time, 0.5);
  t.equal(eventData.deltaTime, 0.5);
  t.equal(eventData.cue, cue);
  t.end();
});

test('vtkAnimationCue: Multiple tick events', (t) => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let tickCount = 0;
  cue.onTickEvent(() => {
    tickCount++;
  });

  cue.play();
  cue.tick(0, 0.3);
  cue.tick(0.3, 0.3);
  cue.tick(0.6, 0.3);

  t.equal(tickCount, 3);
  t.ok(cue.isPlaying());
  t.end();
});
