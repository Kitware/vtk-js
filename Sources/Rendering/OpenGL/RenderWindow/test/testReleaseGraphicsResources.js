import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createConeActor,
  createTrackedRenderView,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the render passes it no longer renders through',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view, emptySceneObjects } =
      createTrackedRenderView(gc);

    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    // The default pass has allocated by now, so replacing it strands whatever
    // it owns unless the setter releases it.
    view.setRenderPasses([gc.registerResource(vtkForwardPass.newInstance())]);
    renderWindow.render();

    gc.releaseResources();
    expect(tracker.count()).toBe(0);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps the resources of the passes it is given',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view } =
      createTrackedRenderView(gc);

    const pass = gc.registerResource(vtkForwardPass.newInstance());
    view.setRenderPasses([pass]);
    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();
    const objectsInUse = tracker.count();

    // Clearing the passes is a supported state: a window that has none draws
    // nothing of its own.
    view.setRenderPasses(null);
    expect(tracker.count()).toBeLessThan(objectsInUse);

    // An application driving the pass itself keeps it allocated while the
    // window renders through none.
    pass.traverse(view, null);
    expect(tracker.count()).toBe(objectsInUse);

    view.setRenderPasses([pass]);
    expect(tracker.count()).toBe(objectsInUse);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'deletes the view when a render pass was deleted first',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { renderer, renderWindow, view } = createTrackedRenderView(gc);

    const pass = vtkForwardPass.newInstance();
    view.setRenderPasses([pass]);
    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();

    // An application that owns its passes may tear them down before the view.
    pass.delete();

    expect(() => gc.releaseResources()).not.toThrow();
  }
);

// A child render window has no context of its own: it draws through the
