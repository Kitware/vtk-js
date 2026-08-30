import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createConeActor,
  createTrackedRenderView,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the translucent pass GPU objects when the view is deleted',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    gc.releaseResources();
    expect(tracker.count()).toBe(0);
  }
);

// Reading z values makes the forward pass capture a depth buffer, so this
// actor is what gives the pass a framebuffer of its own to hand out.
function createDepthReadingActor(gc, callback) {
  const cone = gc.registerResource(vtkConeSource.newInstance());
  const mapper = gc.registerResource(vtkPixelSpaceCallbackMapper.newInstance());
  mapper.setInputConnection(cone.getOutputPort());
  mapper.setUseZValues(true);
  mapper.setCallback(callback);
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  return actor;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'draws the same image after the view releases its render pass resources',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view, emptySceneObjects } =
      createTrackedRenderView(gc);

    let depthReads = 0;
    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.addActor(createDepthReadingActor(gc, () => (depthReads += 1)));
    renderer.resetCamera();

    const beforeRelease = view.captureNextImage();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);
    expect(depthReads).toBeGreaterThan(0);

    const depthReadsBeforeRelease = depthReads;
    view.releaseGraphicsResources();

    const afterRelease = view.captureNextImage();
    renderWindow.render();
    expect(await afterRelease).toBe(await beforeRelease);
    expect(depthReads).toBeGreaterThan(depthReadsBeforeRelease);

    gc.releaseResources();
  }
);
