import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';

function createLineActor2D(gc) {
  const line = gc.registerResource(
    vtkLineSource.newInstance({ point1: [2, 2, 0], point2: [14, 14, 0] })
  );
  const coordinate = gc.registerResource(vtkCoordinate.newInstance());
  coordinate.setCoordinateSystemToWorld();

  const mapper = gc.registerResource(vtkMapper2D.newInstance());
  mapper.setInputConnection(line.getOutputPort());
  mapper.setTransformCoordinate(coordinate);
  mapper.setScalarVisibility(false);

  const actor = gc.registerResource(vtkActor2D.newInstance());
  actor.setMapper(mapper);
  return actor;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the GPU objects of a 2D actor removed from a view',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const actor = createLineActor2D(gc);
    renderer.addActor2D(actor);
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    renderer.removeActor2D(actor);
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);

    gc.releaseResources();
  }
);
