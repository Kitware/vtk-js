import { it, expect } from 'vitest';
import vtkAnimationCue from 'vtk.js/Sources/Common/Core/AnimationCue';
import { TimeMode } from 'vtk.js/Sources/Common/Core/AnimationCue/Constants';

it('vtkAnimationCue: Basic instantiation', () => {
  const cue = vtkAnimationCue.newInstance();
  expect(cue).toBeTruthy();
  expect(cue.getStartTime()).toBe(0);
  expect(cue.getEndTime()).toBe(1);
  expect(cue.getTime()).toBe(0);
});

it('vtkAnimationCue: Start and end times', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 1, endTime: 5 });
  expect(cue.getStartTime()).toBe(1);
  expect(cue.getEndTime()).toBe(5);

  cue.setStartTime(2);
  cue.setEndTime(8);
  expect(cue.getStartTime()).toBe(2);
  expect(cue.getEndTime()).toBe(8);
});

it('vtkAnimationCue: Play, pause, stop', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  expect(cue.isActive()).toBeFalsy();
  expect(cue.isPlaying()).toBeFalsy();

  cue.play();
  expect(cue.isActive()).toBeTruthy();
  expect(cue.isPlaying()).toBeTruthy();
  expect(cue.getTime()).toBe(0);

  cue.pause();
  expect(cue.isActive()).toBeTruthy();
  expect(cue.isPlaying()).toBeFalsy();

  cue.play();
  expect(cue.isPlaying()).toBeTruthy();

  cue.stop();
  expect(cue.isActive()).toBeFalsy();
  expect(cue.getTime()).toBe(0);
});

it('vtkAnimationCue: Tick updates time while playing', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 5 });

  cue.play();
  cue.tick(0.5, 0.5);
  expect(cue.getTime()).toBe(0.5);

  cue.tick(1.0, 0.5);
  expect(cue.getTime()).toBe(1.0);

  // Not playing, tick should not update
  cue.pause();
  cue.tick(1.5, 0.5);
  expect(cue.getTime()).toBe(1.0);
});

it('vtkAnimationCue: Tick clamps to end time', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let tickEventCalled = false;
  let finalTime = 0;
  let endedAt = null;

  cue.onTickEvent((evt) => {
    tickEventCalled = true;
    finalTime = evt.time;
  });
  cue.onEndCueEvent((evt) => {
    endedAt = evt.time;
  });

  cue.play();

  // a tick at exactly the end time still runs
  cue.tick(2, 2);
  expect(cue.getTime()).toBe(2);
  expect(cue.isPlaying()).toBeTruthy();
  expect(tickEventCalled).toBeTruthy();
  expect(finalTime).toBe(2);

  // the first tick beyond the end time closes the window
  cue.tick(2.5, 0.5);
  expect(cue.getTime()).toBe(2);
  expect(cue.isPlaying()).toBeFalsy();
  expect(cue.isCueStarted()).toBeFalsy();
  expect(endedAt).toBe(2);
});

it('vtkAnimationCue: Tick event callback', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let eventData = null;
  cue.onTickEvent((evt) => {
    eventData = evt;
  });

  cue.play();
  cue.tick(0.5, 0.5);

  expect(eventData).toBeTruthy();
  expect(eventData.time).toBe(0.5);
  expect(eventData.deltaTime).toBe(0.5);
});

it('vtkAnimationCue: Multiple tick events', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let tickCount = 0;
  cue.onTickEvent(() => {
    tickCount++;
  });

  cue.play();
  cue.tick(0, 0.3);
  cue.tick(0.3, 0.3);
  cue.tick(0.6, 0.3);

  expect(tickCount).toBe(3);
  expect(cue.isPlaying()).toBeTruthy();
});

it('vtkAnimationCue: A cue enters and leaves its own window', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 1, endTime: 2 });

  const events = [];
  cue.onStartCueEvent((evt) => events.push(['start', evt.time]));
  cue.onEndCueEvent((evt) => events.push(['end', evt.time]));

  // before the window, a tick does nothing
  cue.tick(0.5, 0.5);
  expect(cue.isCueStarted()).toBeFalsy();
  expect(cue.isPlaying()).toBeFalsy();
  expect(events.length).toBe(0);

  // the window opens on its own, without a play() call
  cue.tick(1, 0.5);
  expect(cue.isCueStarted()).toBeTruthy();
  expect(cue.isPlaying()).toBeTruthy();
  expect(cue.getTime()).toBe(1);
  expect(events).toEqual([['start', 1]]);

  cue.tick(2.5, 0.5);
  expect(cue.isCueStarted()).toBeFalsy();
  expect(cue.isPlaying()).toBeFalsy();
  expect(events).toEqual([
    ['start', 1],
    ['end', 2],
  ]);

  // a closed window stays closed until the cue is armed again
  cue.tick(1.5, 0.5);
  expect(cue.isCueStarted()).toBeFalsy();

  cue.initialize();
  cue.tick(1.5, 0.5);
  expect(cue.isCueStarted()).toBeTruthy();
  expect(cue.getTime()).toBe(1.5);
});

it('vtkAnimationCue: finalize ends a running cue', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let endedAt = null;
  cue.onEndCueEvent((evt) => {
    endedAt = evt.time;
  });

  cue.play();
  cue.tick(1, 1);
  expect(cue.isCueStarted()).toBeTruthy();

  cue.finalize();
  expect(cue.isCueStarted()).toBeFalsy();
  expect(cue.isPlaying()).toBeFalsy();
  expect(endedAt).toBe(2);
});

it('vtkAnimationCue: The three events come in order', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 1 });
  const calls = [];

  cue.onStartCueEvent(() => calls.push('start'));
  cue.onTickEvent(() => calls.push('tick'));
  cue.onEndCueEvent(() => calls.push('end'));

  cue.play();
  cue.tick(0.5, 0.5);
  cue.tick(1.5, 0.5);

  expect(calls).toEqual(['start', 'tick', 'end']);
});

it('vtkAnimationCue: Time mode', () => {
  const cue = vtkAnimationCue.newInstance();
  expect(cue.getTimeMode()).toBe(TimeMode.RELATIVE);

  cue.setTimeModeToNormalized();
  expect(cue.getTimeMode()).toBe(TimeMode.NORMALIZED);

  cue.setTimeModeToRelative();
  expect(cue.getTimeMode()).toBe(TimeMode.RELATIVE);
});
