import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createTrackedRenderView,
  expectSameImageAfterRelease,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';

function createGlyphActor(gc) {
  const planeSource = gc.registerResource(vtkPlaneSource.newInstance());
  const coneSource = gc.registerResource(vtkConeSource.newInstance());
  const mapper = gc.registerResource(vtkGlyph3DMapper.newInstance());
  mapper.setInputConnection(planeSource.getOutputPort(), 0);
  mapper.setInputConnection(coneSource.getOutputPort(), 1);
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  return actor;
}

// Glyphs add per-instance matrix, normal, color and pick buffers.
it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the GPU objects of a glyph actor removed from a view',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const actor = createGlyphActor(gc);
    renderer.addActor(actor);
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    renderer.removeActor(actor);
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'rebuilds the same image after releaseGraphicsResources',
  () => expectSameImageAfterRelease(createGlyphActor)
);
