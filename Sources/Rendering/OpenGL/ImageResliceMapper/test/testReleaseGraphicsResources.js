import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageResliceMapper from 'vtk.js/Sources/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLImageResliceMapper from 'vtk.js/Sources/Rendering/OpenGL/ImageResliceMapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const sideLen = 32;

// A reslice mapper whose OpenGL view node shows the handles of its default
// lookup textures
const newInspectableImageResliceMapper = macro.newInstance(
  (publicAPI, model, initialValues) => {
    vtkImageResliceMapper.extend(publicAPI, model, initialValues);
    model.classHierarchy.push('vtkInspectableImageResliceMapper');
  }
);
registerOverride(
  'vtkInspectableImageResliceMapper',
  macro.newInstance((publicAPI, model, initialValues) => {
    vtkOpenGLImageResliceMapper.extend(publicAPI, model, initialValues);
    publicAPI.getDefaultTextureHandles = () => ({
      color: model._defaultColorTexture?.oglObject.getHandle(),
      opacity: model._defaultPwfTexture?.oglObject.getHandle(),
    });
  })
);

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
  const mapper = gc.registerResource(newInspectableImageResliceMapper());
  mapper.setInputData(imageData);
  mapper.setSlicePlane(slicePlane);
  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.setMapper(mapper);

  tracked.renderer.addActor(actor);
  tracked.renderer.resetCamera();
  tracked.renderWindow.render();
  return { ...tracked, actor, mapper, slicePlane };
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'reuses its default lookup textures across slice plane and property changes',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, view, actor, mapper, slicePlane } =
      renderResliceSlice(gc);
    const objectsAfterFirstRender = tracker.count();
    const node = view.getViewNodeFor(mapper);
    const handles = node.getDefaultTextureHandles();
    expect(handles.color).toBeTruthy();
    expect(handles.opacity).toBeTruthy();

    for (let z = 1; z < sideLen / 2; ++z) {
      slicePlane.setOrigin(0, 0, z);
      renderWindow.render();
      expect(node.getDefaultTextureHandles()).toEqual(handles);
    }
    actor.getProperty().setColorWindow(1000);
    actor.getProperty().setColorLevel(500);
    renderWindow.render();
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'replaces a default lookup texture when its width changes, freeing the old one',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, view, mapper } = renderResliceSlice(gc);
    const objectsAfterFirstRender = tracker.count();
    const node = view.getViewNodeFor(mapper);
    const first = node.getDefaultTextureHandles();

    mapper.setColorTextureWidth(512);
    renderWindow.render();
    const afterColor = node.getDefaultTextureHandles();
    expect(afterColor.color).toBeTruthy();
    expect(afterColor.color).not.toBe(first.color);
    expect(afterColor.opacity).toBe(first.opacity);
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    mapper.setOpacityTextureWidth(512);
    renderWindow.render();
    const afterOpacity = node.getDefaultTextureHandles();
    expect(afterOpacity.opacity).toBeTruthy();
    expect(afterOpacity.opacity).not.toBe(first.opacity);
    expect(afterOpacity.color).toBe(afterColor.color);
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
