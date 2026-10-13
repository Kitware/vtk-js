import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLImageMapper from 'vtk.js/Sources/Rendering/OpenGL/ImageMapper';
import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const sliceCount = 16;

// An image mapper whose OpenGL view node counts its buffer object builds
let bufferObjectBuilds = 0;
const newCountingImageMapper = macro.newInstance(
  (publicAPI, model, initialValues) => {
    vtkImageMapper.extend(publicAPI, model, initialValues);
    model.classHierarchy.push('vtkCountingImageMapper');
  }
);
registerOverride(
  'vtkCountingImageMapper',
  macro.newInstance((publicAPI, model, initialValues) => {
    vtkOpenGLImageMapper.extend(publicAPI, model, initialValues);
    const { buildBufferObjects } = publicAPI;
    publicAPI.buildBufferObjects = (ren, actor) => {
      bufferObjectBuilds += 1;
      buildBufferObjects(ren, actor);
    };
  })
);

// The property has no transfer functions, so the mapper draws with its default
// grayscale ramp and fully opaque lookup textures.
function renderImageSlice(gc) {
  const tracked = createTrackedRenderView(gc);

  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(32, 32, sliceCount);
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: Uint16Array.from(
        { length: 32 * 32 * sliceCount },
        (_, i) => i % 4096
      ),
    })
  );

  const mapper = gc.registerResource(newCountingImageMapper());
  mapper.setInputData(imageData);
  mapper.setSlicingMode(SlicingMode.K);
  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);

  tracked.renderer.addActor(actor);
  tracked.renderer.resetCamera();
  tracked.renderWindow.render();
  return { ...tracked, actor, mapper };
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'rebuilds once after a property change instead of on every render',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, actor } = renderImageSlice(gc);
    const objectsAfterFirstRender = tracker.count();
    const buildsAfterFirstRender = bufferObjectBuilds;

    actor.getProperty().setColorWindow(1000);
    actor.getProperty().setColorLevel(500);
    for (let i = 0; i < 20; ++i) {
      renderWindow.render();
    }
    expect(bufferObjectBuilds - buildsAfterFirstRender).toBe(1);
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'reuses its default lookup textures across slice and interpolation changes',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, actor, mapper } = renderImageSlice(gc);
    const objectsAfterFirstRender = tracker.count();

    for (let slice = 1; slice < sliceCount; ++slice) {
      mapper.setSlice(slice);
      renderWindow.render();
    }
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    // a new interpolation type replaces the color texture
    actor.getProperty().setInterpolationTypeToNearest();
    renderWindow.render();
    actor.getProperty().setInterpolationTypeToLinear();
    renderWindow.render();
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees its default lookup textures when the slice leaves the scene',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, actor } = renderImageSlice(gc);
    const objectsInScene = tracker.count();

    renderer.removeActor(actor);
    renderWindow.render();
    // at least the scalar, color and opacity textures
    expect(objectsInScene - tracker.count()).toBeGreaterThanOrEqual(3);

    gc.releaseResources();
  }
);
