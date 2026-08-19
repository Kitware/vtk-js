import { it, expect, vi, afterEach } from 'vitest';

import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

// Helpers ----------------------------------------------------------------

function makePointerEvent(
  type,
  { button = 0, buttons = 0, x = 100, y = 100, pointerId = 1 } = {}
) {
  return new PointerEvent(type, {
    bubbles: true,
    pointerId: pointerId,
    pointerType: 'touch',
    button,
    buttons,
    clientX: x,
    clientY: y,
  });
}

function setupInteractor() {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: 400 });
  Object.defineProperty(container, 'clientHeight', { value: 400 });
  // Stub pointer capture methods — synthetic PointerEvents have no real
  // active pointer, so the native methods throw NotFoundError.
  container.setPointerCapture = () => {};
  container.releasePointerCapture = () => {};
  container.hasPointerCapture = () => false;
  document.body.appendChild(container);

  // Create a minimal mock renderer so that events are not silently dropped
  // by the enabled/renderer checks in the interactor event pipeline.
  const mockRenderer = { getLayer: () => 0, getInteractive: () => true };
  const interactor = vtkRenderWindowInteractor.newInstance({
    _forcedRenderer: true,
    currentRenderer: mockRenderer,
    _getScreenEventPositionFor: (source) => ({
      x: source.clientX,
      y: source.clientY,
      z: 0,
      movementX: source.movementX || 0,
      movementY: source.movementY || 0,
    }),
  });
  interactor.setContainer(container);
  interactor.initialize();

  return { container, interactor };
}

function teardown({ container, interactor }) {
  interactor.setContainer(null);
  interactor.delete();
  container.remove();
}

// Simulates a diagonal slide (down, move, move, up) in a given time on a given distance
function tapTest(container, time, distance) {
  const origX = 100;
  const origY = 100;
  const finalX = origX + distance / Math.sqrt(2);
  const finalY = origY + distance / Math.sqrt(2);

  container.dispatchEvent(
    makePointerEvent('pointerdown', { button: 1, buttons: 1 })
  );
  vi.advanceTimersByTime(time / 3);
  container.dispatchEvent(
    makePointerEvent('pointermove', {
      button: -1,
      buttons: 1,
      x: (100 + finalX) / 2,
      y: (100 + finalY) / 2,
    })
  );
  vi.advanceTimersByTime(time / 3);
  container.dispatchEvent(
    makePointerEvent('pointermove', {
      button: -1,
      buttons: 1,
      x: finalX,
      y: finalY,
    })
  );
  vi.advanceTimersByTime(time / 3);
  container.dispatchEvent(
    makePointerEvent('pointerup', { button: 1, buttons: 0 })
  );
}

afterEach(() => {
  vi.useRealTimers();
});

// Tests ------------------------------------------------------------------

it('Test RenderWindowInteractor handles taps well', () => {
  const env = setupInteractor();
  const { container, interactor } = env;

  const events = [];
  const subs = [
    interactor.onTap(() => events.push('Tap')),
    interactor.onLongTap(() => events.push('LongTap')),
  ];

  vi.useFakeTimers();

  // Test Tap
  tapTest(container, 490, 28);
  expect(events).toEqual(['Tap']);
  events.splice(0);

  // Test Tap fail because the pointer moved too much
  tapTest(container, 490, 32);
  expect(events).toEqual([]);
  events.splice(0);

  // Test LongTap
  tapTest(container, 510, 28);
  expect(events).toEqual(['LongTap']);
  events.splice(0);

  // Test LongTap fail because the user moved too much
  tapTest(container, 510, 32);
  expect(events).toEqual([]);
  events.splice(0);

  // Test Tap fail because an additional pointer is added
  container.dispatchEvent(
    makePointerEvent('pointerdown', { button: 1, buttons: 1 })
  );
  vi.advanceTimersByTime(480);
  container.dispatchEvent(
    makePointerEvent('pointerdown', {
      button: 2,
      buttons: 3,
      x: 200,
      y: 200,
      pointerId: 2,
    })
  );
  vi.advanceTimersByTime(100);
  container.dispatchEvent(
    makePointerEvent('pointerup', { button: 1, buttons: 2, pointerId: 2 })
  );
  container.dispatchEvent(
    makePointerEvent('pointerup', { button: 2, buttons: 0 })
  );
  expect(events).toEqual([]);
  events.splice(0);

  subs.forEach((s) => s.unsubscribe());

  teardown(env);
});
