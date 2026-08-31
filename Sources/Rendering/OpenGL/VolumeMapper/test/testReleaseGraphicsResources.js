import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

function createVolume(gc) {
  const sideLen = 16;
  const imageData = vtkImageData.newInstance();
  imageData.setExtent(0, sideLen - 1, 0, sideLen - 1, 0, sideLen - 1);
  const scalars = vtkDataArray.newInstance({
    name: 'scalars',
    numberOfComponents: 1,
    values: Float32Array.from(
      { length: sideLen ** 3 },
      (_, i) => (i % sideLen) / sideLen
    ),
  });
  imageData.getPointData().setScalars(scalars);

  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setInputData(imageData);
  // Scales above 1.5 make the mapper render through a framebuffer it owns
  // while interacting. renderPieceStart latches this on its first render.
  mapper.setInitialInteractionScale(2.0);

  const volume = gc.registerResource(vtkVolume.newInstance());
  volume.setMapper(mapper);

  const color = gc.registerResource(vtkColorTransferFunction.newInstance());
  color.addRGBPoint(0.0, 0.0, 0.0, 0.0);
  color.addRGBPoint(1.0, 1.0, 0.5, 0.3);
  const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
  opacity.addPoint(0.0, 0.0);
  opacity.addPoint(1.0, 1.0);
  volume.getProperty().setRGBTransferFunction(0, color);
  volume.getProperty().setScalarOpacity(0, opacity);

  return volume;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the volume mapper GPU objects when the volume leaves the scene',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view, emptySceneObjects } =
      createTrackedRenderView(gc);

    const volume = createVolume(gc);
    renderer.addVolume(volume);
    renderer.resetCamera();
    renderWindow.render();

    const objectsBeforeInteraction = tracker.count();
    const interactor = renderWindow.getInteractor();
    interactor.requestAnimation('test');
    // render() is a no-op while animating, so drive the passes directly
    view.traverseAllPasses();
    interactor.cancelAnimation('test');
    // the interaction framebuffer and its attachments
    expect(tracker.count()).toBeGreaterThan(objectsBeforeInteraction);

    renderer.removeVolume(volume);
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'still draws the volume after the mapper releases its resources',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view, emptySceneObjects } =
      createTrackedRenderView(gc);

    const emptyImage = view.captureNextImage();
    renderWindow.render();

    const volume = createVolume(gc);
    renderer.addVolume(volume);
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    view.getViewNodeFor(volume.getMapper()).releaseGraphicsResources();

    const afterRelease = view.captureNextImage();
    renderWindow.render();
    // The ray cast jitter texture is rebuilt from fresh noise, so the pixels
    // are not reproducible across a release. What has to hold is that the
    // mapper rebuilt what it gave up and still draws the volume.
    expect(await afterRelease).not.toBe(await emptyImage);
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    gc.releaseResources();
  }
);
