import { it, expect } from 'vitest';
import vtkAnimationCue from 'vtk.js/Sources/Common/Core/AnimationCue';

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
  cue.tick(0, 0.5);
  expect(cue.getTime()).toBe(0.5);

  cue.tick(0.5, 0.5);
  expect(cue.getTime()).toBe(1.0);

  // Not playing, tick should not update
  cue.pause();
  cue.tick(1.0, 0.5);
  expect(cue.getTime()).toBe(1.0);
});

it('vtkAnimationCue: Tick clamps to end time', () => {
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

  expect(cue.getTime()).toBe(2); // Clamped to end time
  expect(cue.isPlaying()).toBeFalsy(); // Should stop after reaching end
  expect(tickEventCalled).toBeTruthy();
  expect(finalTime).toBe(2);
});

it('vtkAnimationCue: Tick event callback', () => {
  const cue = vtkAnimationCue.newInstance({ startTime: 0, endTime: 2 });

  let eventData = null;
  cue.onTickEvent((evt) => {
    eventData = evt;
  });

  cue.play();
  cue.tick(0, 0.5);

  expect(eventData).toBeTruthy();
  expect(eventData.time).toBe(0.5);
  expect(eventData.deltaTime).toBe(0.5);
  expect(eventData.cue).toBe(cue);
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
