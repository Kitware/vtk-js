import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createTrackedRenderView,
  expectSameImageAfterRelease,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

function createConeActor(gc) {
  const cone = gc.registerResource(vtkConeSource.newInstance());
  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(cone.getOutputPort());
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  return actor;
}

// A lookup table makes the mapper own a color texture.
function createScalarColoredConeActor(gc) {
  const cone = gc.registerResource(vtkConeSource.newInstance());
  cone.update();
  const polyData = cone.getOutputData();
  const pointCount = polyData.getPoints().getNumberOfPoints();
  polyData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: Float32Array.from({ length: pointCount }, (_, i) => i),
    })
  );

  const lookupTable = gc.registerResource(
    vtkColorTransferFunction.newInstance()
  );
  lookupTable.addRGBPoint(0, 0, 0, 1);
  lookupTable.addRGBPoint(pointCount, 1, 0, 0);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputData(polyData);
  mapper.setLookupTable(lookupTable);
  mapper.setUseLookupTableScalarRange(true);
  mapper.setInterpolateScalarsBeforeMapping(true);
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  return actor;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the GPU objects of actors removed from a view',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const actors = [
      createConeActor(gc),
      createConeActor(gc),
      createScalarColoredConeActor(gc),
    ];
    actors.forEach((actor) => renderer.addActor(actor));
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    actors.forEach((actor) => renderer.removeActor(actor));
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees only the closed view GPU objects on a shared context',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const tracker = testUtils.trackWebGLObjects();

    const rootRenderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const rootView = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
    rootRenderWindow.addView(rootView);
    rootView.initialize();

    // The child render windows, their view nodes and their renderers are not
    // gc-registered: the closing one is deleted explicitly below.
    const addChildView = () => {
      const childRenderWindow = vtkRenderWindow.newInstance();
      rootRenderWindow.addRenderWindow(childRenderWindow);
      const childView = rootView.addMissingNode(childRenderWindow);
      childRenderWindow.addView(childView);
      childView.setContainer(testUtils.createRenderContainer(gc));
      childView.setSize(200, 200);

      const renderer = vtkRenderer.newInstance();
      childRenderWindow.addRenderer(renderer);
      renderer.addActor(createConeActor(gc));
      renderer.resetCamera();

      return { childRenderWindow, childView };
    };

    const closing = addChildView();
    const surviving = addChildView();
    rootRenderWindow.render();

    const bothViewsObjects = tracker.count();
    const survivingBefore = surviving.childView.captureNextImage();
    rootRenderWindow.render();
    expect(tracker.count()).toBe(bothViewsObjects);

    rootRenderWindow.removeRenderWindow(closing.childRenderWindow);
    closing.childRenderWindow.delete();

    const survivingAfter = surviving.childView.captureNextImage();
    rootRenderWindow.render();

    expect(tracker.count()).toBeLessThan(bothViewsObjects);
    expect(await survivingAfter).toBe(await survivingBefore);

    gc.releaseResources();
  }
);

// The scalar-colored actor makes the released color texture come back too.
it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'rebuilds the same image after releaseGraphicsResources',
  () => expectSameImageAfterRelease(createScalarColoredConeActor)
);
