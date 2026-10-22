import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageCPRMapper from 'vtk.js/Sources/Rendering/Core/ImageCPRMapper';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLImageCPRMapper from 'vtk.js/Sources/Rendering/OpenGL/ImageCPRMapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const sideLen = 32;
const width = 20;

// A CPR mapper whose OpenGL view node counts its buffer object builds and
// shows the handles of its default lookup textures
let bufferObjectBuilds = 0;
const newCountingImageCPRMapper = macro.newInstance(
  (publicAPI, model, initialValues) => {
    vtkImageCPRMapper.extend(publicAPI, model, initialValues);
    model.classHierarchy.push('vtkCountingImageCPRMapper');
  }
);
registerOverride(
  'vtkCountingImageCPRMapper',
  macro.newInstance((publicAPI, model, initialValues) => {
    vtkOpenGLImageCPRMapper.extend(publicAPI, model, initialValues);
    const { buildBufferObjects } = publicAPI;
    publicAPI.buildBufferObjects = (ren, actor) => {
      bufferObjectBuilds += 1;
      buildBufferObjects(ren, actor);
    };
    publicAPI.getDefaultTextureHandles = () => ({
      color: model._defaultColorTexture?.oglObject.getHandle(),
      opacity: model._defaultPwfTexture?.oglObject.getHandle(),
    });
  })
);

// The property has no transfer functions, so the mapper draws with its default
// grayscale ramp and fully opaque lookup textures.
function renderCPRSlice(gc) {
  const tracked = createTrackedRenderView(gc);

  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(sideLen, sideLen, sideLen);
  imageData.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'scalars',
      values: Uint16Array.from({ length: sideLen ** 3 }, (_, i) => i % 4096),
    })
  );

  // A straight centerline through the middle of the volume
  const centerline = vtkPolyData.newInstance();
  centerline
    .getPoints()
    .setData(Float32Array.from([16, 16, 2, 16, 16, 16, 16, 16, 29]), 3);
  centerline.getLines().setData(Uint16Array.from([3, 0, 1, 2]));

  const mapper = gc.registerResource(newCountingImageCPRMapper());
  mapper.setUseUniformOrientation(true);
  mapper.setImageData(imageData);
  mapper.setCenterlineData(centerline);
  mapper.setWidth(width);
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
    const { tracker, renderWindow, actor } = renderCPRSlice(gc);
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
  'reuses its default lookup textures when the mapper changes',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, view, mapper } = renderCPRSlice(gc);
    const objectsAfterFirstRender = tracker.count();
    const node = view.getViewNodeFor(mapper);
    const handles = node.getDefaultTextureHandles();
    expect(handles.color).toBeTruthy();
    expect(handles.opacity).toBeTruthy();

    for (let i = 1; i < 16; ++i) {
      mapper.setWidth(width + i);
      renderWindow.render();
      expect(node.getDefaultTextureHandles()).toEqual(handles);
    }
    expect(tracker.count()).toBe(objectsAfterFirstRender);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'replaces a default lookup texture when its width changes, freeing the old one',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderWindow, view, mapper } = renderCPRSlice(gc);
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
    const { tracker, renderer, renderWindow, actor } = renderCPRSlice(gc);
    const objectsInScene = tracker.count();

    renderer.removeActor(actor);
    renderWindow.render();
    // at least the volume, color and opacity textures
    expect(objectsInScene - tracker.count()).toBeGreaterThanOrEqual(3);

    gc.releaseResources();
  }
);
