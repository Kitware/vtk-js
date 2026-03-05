import { it, expect } from 'vitest';

import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

// Helpers ----------------------------------------------------------------

function makePointerEvent(type, { button = 0, buttons = 0 } = {}) {
  return new PointerEvent(type, {
    bubbles: true,
    pointerId: 1,
    pointerType: 'mouse',
    button,
    buttons,
    clientX: 100,
    clientY: 100,
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

// Tests ------------------------------------------------------------------

it('Test RenderWindowInteractor chorded button press', () => {
  const env = setupInteractor();
  const { container, interactor } = env;

  const events = [];
  const sub1 = interactor.onLeftButtonPress(() =>
    events.push('LeftButtonPress')
  );
  const sub2 = interactor.onRightButtonPress(() =>
    events.push('RightButtonPress')
  );
  const sub3 = interactor.onLeftButtonRelease(() =>
    events.push('LeftButtonRelease')
  );
  const sub4 = interactor.onRightButtonRelease(() =>
    events.push('RightButtonRelease')
  );

  // 1. Press left button (pointerdown fires for first button)
  container.dispatchEvent(
    makePointerEvent('pointerdown', { button: 0, buttons: 1 })
  );
  expect(events).toEqual(['LeftButtonPress']);

  // 2. Press right while left held (pointermove with button change per spec §10)
  container.dispatchEvent(
    makePointerEvent('pointermove', { button: 2, buttons: 3 })
  );
  expect(events.includes('RightButtonPress')).toBeTruthy();

  // 3. Release left while right held (pointermove with button change)
  events.length = 0;
  container.dispatchEvent(
    makePointerEvent('pointermove', { button: 0, buttons: 2 })
  );
  expect(events).toEqual(['LeftButtonRelease']);

  // 4. Release right - last button (pointerup fires)
  events.length = 0;
  container.dispatchEvent(
    makePointerEvent('pointerup', { button: 2, buttons: 0 })
  );
  expect(events).toEqual(['RightButtonRelease']);

  sub1.unsubscribe();
  sub2.unsubscribe();
  sub3.unsubscribe();
  sub4.unsubscribe();
  teardown(env);
});

it('Test RenderWindowInteractor single button (no false chorded events)', () => {
  const env = setupInteractor();
  const { container, interactor } = env;

  const events = [];
  const sub1 = interactor.onLeftButtonPress(() =>
    events.push('LeftButtonPress')
  );
  const sub2 = interactor.onLeftButtonRelease(() =>
    events.push('LeftButtonRelease')
  );
  const sub3 = interactor.onRightButtonPress(() =>
    events.push('RightButtonPress')
  );
  const sub4 = interactor.onRightButtonRelease(() =>
    events.push('RightButtonRelease')
  );

  // Normal left click cycle
  container.dispatchEvent(
    makePointerEvent('pointerdown', { button: 0, buttons: 1 })
  );
  container.dispatchEvent(
    makePointerEvent('pointermove', { button: -1, buttons: 1 })
  );
  container.dispatchEvent(
    makePointerEvent('pointerup', { button: 0, buttons: 0 })
  );

  expect(events).toEqual(['LeftButtonPress', 'LeftButtonRelease']);

  sub1.unsubscribe();
  sub2.unsubscribe();
  sub3.unsubscribe();
  sub4.unsubscribe();
  teardown(env);
});

it('Test RenderWindowInteractor three-button chord', () => {
  const env = setupInteractor();
  const { container, interactor } = env;

  const events = [];
  const subs = [
    interactor.onLeftButtonPress(() => events.push('LP')),
    interactor.onMiddleButtonPress(() => events.push('MP')),
    interactor.onRightButtonPress(() => events.push('RP')),
    interactor.onLeftButtonRelease(() => events.push('LR')),
    interactor.onMiddleButtonRelease(() => events.push('MR')),
    interactor.onRightButtonRelease(() => events.push('RR')),
  ];

  // Press left
  container.dispatchEvent(
    makePointerEvent('pointerdown', { button: 0, buttons: 1 })
  );
  // Press middle (chorded)
  container.dispatchEvent(
    makePointerEvent('pointermove', { button: 1, buttons: 5 })
  );
  // Press right (chorded)
  container.dispatchEvent(
    makePointerEvent('pointermove', { button: 2, buttons: 7 })
  );
  // Release all three simultaneously (only pointerup fires with buttons=0)
  container.dispatchEvent(
    makePointerEvent('pointerup', { button: 0, buttons: 0 })
  );

  // Chorded releases (middle, right) fire before the primary button release
  // (left) which is handled by handleMouseUp.
  expect(events).toEqual(['LP', 'MP', 'RP', 'MR', 'RR', 'LR']);

  subs.forEach((s) => s.unsubscribe());
  teardown(env);
});

it('Test RenderWindowInteractor pointercancel releases all held buttons', () => {
  const env = setupInteractor();
  const { container, interactor } = env;

  const events = [];
  const subs = [
    interactor.onLeftButtonPress(() => events.push('LP')),
    interactor.onMiddleButtonPress(() => events.push('MP')),
    interactor.onRightButtonPress(() => events.push('RP')),
    interactor.onLeftButtonRelease(() => events.push('LR')),
    interactor.onMiddleButtonRelease(() => events.push('MR')),
    interactor.onRightButtonRelease(() => events.push('RR')),
  ];

  // Press left
  container.dispatchEvent(
    makePointerEvent('pointerdown', { button: 0, buttons: 1 })
  );
  // Press middle (chorded)
  container.dispatchEvent(
    makePointerEvent('pointermove', { button: 1, buttons: 5 })
  );

  events.length = 0;

  // Cancel the interaction — all held buttons should be released
  container.dispatchEvent(
    makePointerEvent('pointercancel', { button: 0, buttons: 0 })
  );

  expect(events).toEqual(['LR', 'MR']);

  subs.forEach((s) => s.unsubscribe());
  teardown(env);
});
