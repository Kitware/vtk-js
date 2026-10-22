import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';

const sideLen = 32;
const sliceCount = 16;

// A real transfer function and piecewise function put the color and opacity
// lookup textures on the render window's shared cache, which already frees
// them on removal. That isolates this test to the tris VAO and vertex
// buffer, the pair of GL objects the mapper never releases.
function renderImageSlice(gc) {
  const tracked = createTrackedRenderView(gc);

  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(sideLen, sideLen, sliceCount);
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: Uint16Array.from(
        { length: sideLen * sideLen * sliceCount },
        (_, i) => i % 4096
      ),
    })
  );

  const color = gc.registerResource(vtkColorTransferFunction.newInstance());
  color.addRGBPoint(0, 0, 0, 0);
  color.addRGBPoint(4095, 1, 1, 1);
  const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
  opacity.addPoint(0, 1);
  opacity.addPoint(4095, 1);

  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputData(imageData);
  mapper.setSlicingMode(SlicingMode.K);
  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);
  actor.getProperty().setRGBTransferFunction(0, color);
  actor.getProperty().setPiecewiseFunction(0, opacity);

  tracked.renderer.addActor(actor);
  tracked.renderer.resetCamera();
  tracked.renderWindow.render();
  return { ...tracked, actor };
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees its vertex buffer and VAO when the slice leaves the scene',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, actor, emptySceneObjects } =
      renderImageSlice(gc);
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    renderer.removeActor(actor);
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);

    gc.releaseResources();
  }
);

// Every voxel is the same bright value, so any pixel inside the slice reads
// back near white regardless of exactly where the camera frames it. The
// background is pure blue, which no grayscale transfer function can produce,
// so a red channel near zero means nothing was drawn.
function createUniformImageSliceActor(gc) {
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(sideLen, sideLen, sliceCount);
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: Uint16Array.from(
        { length: sideLen * sideLen * sliceCount },
        () => 4095
      ),
    })
  );

  const color = gc.registerResource(vtkColorTransferFunction.newInstance());
  color.addRGBPoint(0, 0, 0, 0);
  color.addRGBPoint(4095, 1, 1, 1);
  const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
  opacity.addPoint(0, 1);
  opacity.addPoint(4095, 1);

  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputData(imageData);
  mapper.setSlicingMode(SlicingMode.K);
  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);
  actor.getProperty().setRGBTransferFunction(0, color);
  actor.getProperty().setPiecewiseFunction(0, opacity);
  return actor;
}

function readCenterPixel(view) {
  const gl = view.getContext();
  const pixel = new Uint8Array(4);
  gl.readPixels(100, 100, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  return pixel;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps drawing the slice after its renderer moves to a different render window',
  () => {
    const gc = testUtils.createGarbageCollector();
    const windowA = createTrackedRenderView(gc);
    windowA.renderer.setBackground(0, 0, 1);

    const actor = createUniformImageSliceActor(gc);
    windowA.renderer.addActor(actor);
    windowA.renderer.resetCamera();
    windowA.renderWindow.render();
    expect(readCenterPixel(windowA.view)[0]).toBeGreaterThan(200);

    const objectsWithActorInA = windowA.tracker.count();

    // A second render window, sharing nothing with the first. Moving the
    // renderer into it gives window B a fresh mapper view node and deletes the
    // old one from window A's view tree. It does not reach the surviving
    // mapper's render-window-switch branch, which no vtk.js API can reach.
    const windowB = createTrackedRenderView(gc);
    windowB.renderer.setBackground(0, 0, 1);

    const { renderer } = windowA;
    windowA.renderWindow.removeRenderer(renderer);
    windowB.renderWindow.removeRenderer(windowB.renderer);
    windowB.renderWindow.addRenderer(renderer);
    renderer.resetCamera();
    windowB.renderWindow.render();

    expect(readCenterPixel(windowB.view)[0]).toBeGreaterThan(200);

    // Give window A's view tree a chance to prune the renderer it no longer
    // has, which is where the departed mapper's resources get released.
    windowA.renderWindow.render();
    expect(windowA.tracker.count()).toBe(objectsWithActorInA);

    gc.releaseResources();
  }
);
