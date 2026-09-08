import { it, expect, describe, beforeEach, afterAll, afterEach } from 'vitest';

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
describe('Chorded buttons events', () => {
  const env = setupInteractor();
  const { container, interactor } = env;

  const events = [];
  let subs;

  beforeEach(() => {
    events.length = 0;
    subs = [
      interactor.onLeftButtonPress(() => events.push('LeftButtonPress')),
      interactor.onMiddleButtonPress(() => events.push('MiddleButtonPress')),
      interactor.onRightButtonPress(() => events.push('RightButtonPress')),
      interactor.onLeftButtonRelease(() => events.push('LeftButtonRelease')),
      interactor.onMiddleButtonRelease(() =>
        events.push('MiddleButtonRelease')
      ),
      interactor.onRightButtonRelease(() => events.push('RightButtonRelease')),
    ];
  });
  afterEach(() => {
    subs.forEach((s) => s.unsubscribe());
    interactor.unbindEvents(); // clear timeouts
    interactor.setContainer(container);
    interactor.initialize();
  });

  it('Test RenderWindowInteractor chorded button press', () => {
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
  });

  it('Test RenderWindowInteractor single button (no false chorded events)', () => {
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
  });

  it('Test RenderWindowInteractor reports the first move of a burst', () => {
    const moveEvents = [];
    const subs2 = [
      interactor.onStartMouseMove(() => moveEvents.push('StartMouseMove')),
      interactor.onMouseMove(() => moveEvents.push('MouseMove')),
    ];

    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 0 })
    );
    expect(moveEvents).toEqual(['StartMouseMove', 'MouseMove']);

    moveEvents.length = 0;
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 0 })
    );
    expect(moveEvents).toEqual(['MouseMove']);

    subs2.forEach((subscription) => subscription.unsubscribe());
  });

  it('Test RenderWindowInteractor three-button chord', () => {
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
    expect(events).toEqual([
      'LeftButtonPress',
      'MiddleButtonPress',
      'RightButtonPress',
      'MiddleButtonRelease',
      'RightButtonRelease',
      'LeftButtonRelease',
    ]);
  });

  it('Test RenderWindowInteractor pointercancel releases all held buttons', () => {
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

    expect(events).toEqual(['LeftButtonRelease', 'MiddleButtonRelease']);
  });

  it('Test no button press when clicked outside the render window', () => {
    // This use-case happens when a user presses a button outside the render window
    // and moves the pointer into the render window. The button press should not be triggered.

    // 1. Miss left button press (outside the render window)
    // 2. Move mouse cursor into the render window
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 1 })
    );
    // 3. Release left button inside the render window (pointerup fires)
    container.dispatchEvent(
      makePointerEvent('pointerup', { button: 0, buttons: 0 })
    );
    expect(events).toEqual(['LeftButtonRelease']);
  });

  it('Test no button release when first clicked outside the render window', () => {
    // 1. Miss left button press outside the render window
    // 2. Move mouse cursor into the render window
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 1 })
    );
    // 3. Miss left button release outside the render window
    // 4. Move mouse cursor into the render window
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 0 })
    );
    expect(events).toEqual([]);
  });

  it('Test release button with chorded events when first clicked outside the render window', () => {
    // 1. Miss left button press (outside the render window)
    // 2. Move mouse cursor into the render window
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 1 })
    );
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 1 })
    );
    expect(events).toEqual([]);

    // 3. Press right while left held (pointermove with button change per spec §10)
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: 2, buttons: 3 })
    );
    expect(events).toEqual(['RightButtonPress']);

    // 4. Release right while left held (pointermove with button change per spec §10)
    events.length = 0;
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: 2, buttons: 1 })
    );
    expect(events).toEqual(['RightButtonRelease']);

    // 5. Release left
    events.length = 0;
    container.dispatchEvent(
      makePointerEvent('pointerup', { button: 0, buttons: 0 })
    );
    expect(events).toEqual(['LeftButtonRelease']);

    // 6. Move
    events.length = 0;
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 0 })
    );
    expect(events).toEqual([]);
  });

  it('Test release button with chorded events when pressed and released outside the render window', () => {
    // 1. Miss left button press
    // 2. Move mouse cursor into the render window
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 1 })
    );
    // 3. Press right while left held (pointermove with button change per spec §10)
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: 2, buttons: 3 })
    );
    expect(events).toEqual(['RightButtonPress']);
    events.length = 0;
    // 4. Release right while left held (pointermove with button change per spec §10)
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: 2, buttons: 1 })
    );
    expect(events).toEqual(['RightButtonRelease']);
    events.length = 0;
    // 5. Miss release left (outside the render window)
    // 6. Move back into the render window (pointermove fires)
    container.dispatchEvent(
      makePointerEvent('pointermove', { button: -1, buttons: 0 })
    );
    expect(events).toEqual([]);
  });

  afterAll(() => {
    teardown(env);
  });
});
