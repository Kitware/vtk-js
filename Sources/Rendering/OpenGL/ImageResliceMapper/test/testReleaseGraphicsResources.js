import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

const sideLen = 32;

// The property has no transfer functions, so the mapper draws with its default
// grayscale ramp and fully opaque lookup textures.
function renderResliceSlice(gc) {
  const tracked = createTrackedRenderView(gc);

  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(sideLen, sideLen, sideLen);
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: Uint16Array.from({ length: sideLen ** 3 }, (_, i) => i % 4096),
    })
  );

  const slicePlane = gc.registerResource(vtkPlane.newInstance());
  slicePlane.setNormal(0, 0, 1);
  const mapper = gc.registerResource(vtkImageResliceMapper.newInstance());
  mapper.setInputData(imageData);
  mapper.setSlicePlane(slicePlane);
  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);

  tracked.renderer.addActor(actor);
  tracked.renderer.resetCamera();
  tracked.renderWindow.render();
  return { ...tracked, actor, slicePlane };
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'reuses its default lookup textures across slice plane and property changes',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, actor, slicePlane } = renderResliceSlice(gc);
    const objectsAfterFirstRender = tracker.count();

    for (let z = 1; z < sideLen / 2; ++z) {
      slicePlane.setOrigin(0, 0, z);
      renderWindow.render();
    }
    actor.getProperty().setColorWindow(1000);
    actor.getProperty().setColorLevel(500);
    renderWindow.render();
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees its default lookup textures when the slice leaves the scene',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, actor } = renderResliceSlice(gc);
    const objectsInScene = tracker.count();

    renderer.removeActor(actor);
    renderWindow.render();
    // at least the scalar, color and opacity textures
    expect(objectsInScene - tracker.count()).toBeGreaterThanOrEqual(3);

    gc.releaseResources();
  }
);
