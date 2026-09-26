import { it, expect, vi } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createConeActor,
  createTrackedRenderView,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the render passes it no longer renders through',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view, emptySceneObjects } =
      createTrackedRenderView(gc);

    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    // The default pass has allocated by now, so replacing it strands whatever
    // it owns unless the setter releases it.
    view.setRenderPasses([gc.registerResource(vtkForwardPass.newInstance())]);
    renderWindow.render();

    gc.releaseResources();
    expect(tracker.count()).toBe(0);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps the resources of the passes it is given',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view } =
      createTrackedRenderView(gc);

    const pass = gc.registerResource(vtkForwardPass.newInstance());
    view.setRenderPasses([pass]);
    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();
    const objectsInUse = tracker.count();

    // Clearing the passes is a supported state: a window that has none draws
    // nothing of its own.
    view.setRenderPasses(null);
    expect(tracker.count()).toBeLessThan(objectsInUse);

    // An application driving the pass itself keeps it allocated while the
    // window renders through none.
    pass.traverse(view, null);
    expect(tracker.count()).toBe(objectsInUse);

    view.setRenderPasses([pass]);
    expect(tracker.count()).toBe(objectsInUse);

    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'deletes the view when a render pass was deleted first',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { renderer, renderWindow, view } = createTrackedRenderView(gc);

    const pass = vtkForwardPass.newInstance();
    view.setRenderPasses([pass]);
    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();

    // An application that owns its passes may tear them down before the view.
    pass.delete();

    expect(() => gc.releaseResources()).not.toThrow();
  }
);

// A child render window has no context of its own: it draws through the
// root's context and frees GPU objects through methods proxied to the root.
function createChildViewSetup(gc) {
  const rootRenderWindow = vtkRenderWindow.newInstance();
  const rootView = vtkOpenGLRenderWindow.newInstance();
  rootRenderWindow.addView(rootView);
  rootView.initialize();

  return {
    rootRenderWindow,
    rootView,
    ...addChildView(gc, rootRenderWindow, rootView),
  };
}

function addChildView(gc, rootRenderWindow, rootView) {
  const childRenderWindow = vtkRenderWindow.newInstance();
  rootRenderWindow.addRenderWindow(childRenderWindow);
  const childView = rootView.addMissingNode(childRenderWindow);
  childRenderWindow.addView(childView);
  childView.setContainer(testUtils.createRenderContainer(gc));
  childView.setSize(200, 200);

  const renderer = vtkRenderer.newInstance();
  childRenderWindow.addRenderer(renderer);
  renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
  renderer.resetCamera();

  return { childRenderWindow, childView };
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'releases and rebuilds the render pass resources of every child view',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const tracker = testUtils.trackWebGLObjects();
    const { rootRenderWindow, rootView, childRenderWindow, childView } =
      createChildViewSetup(gc);
    const sibling = addChildView(gc, rootRenderWindow, rootView);

    const childBeforeRelease = childView.captureNextImage();
    const siblingBeforeRelease = sibling.childView.captureNextImage();
    rootRenderWindow.render();
    const objectsInUse = tracker.count();
    expect(objectsInUse).toBeGreaterThan(0);

    rootView.releaseGraphicsResources();
    const objectsAfterRelease = tracker.count();
    [childView, sibling.childView].forEach((view) =>
      view
        .getRenderPasses()
        .forEach((pass) => pass.releaseGraphicsResources(view))
    );
    expect(tracker.count()).toBe(objectsAfterRelease);
    expect(objectsAfterRelease).toBeLessThan(objectsInUse);

    const childAfterRelease = childView.captureNextImage();
    const siblingAfterRelease = sibling.childView.captureNextImage();
    rootRenderWindow.render();
    expect(tracker.count()).toBe(objectsInUse);
    expect(await childAfterRelease).toBe(await childBeforeRelease);
    expect(await siblingAfterRelease).toBe(await siblingBeforeRelease);

    rootView.delete();
    rootRenderWindow.delete();
    childRenderWindow.delete();
    sibling.childRenderWindow.delete();
    gc.releaseResources();
    expect(tracker.count()).toBe(0);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the render passes of a deleted child render window',
  () => {
    const gc = testUtils.createGarbageCollector();
    const tracker = testUtils.trackWebGLObjects();
    const { rootRenderWindow, rootView, childRenderWindow } =
      createChildViewSetup(gc);

    rootRenderWindow.render();
    expect(tracker.count()).toBeGreaterThan(0);

    rootRenderWindow.removeRenderWindow(childRenderWindow);
    childRenderWindow.delete();
    // The next render prunes the child view node, which deletes it.
    rootRenderWindow.render();
    expect(tracker.count()).toBe(0);

    rootView.delete();
    rootRenderWindow.delete();
    gc.releaseResources();
    expect(tracker.count()).toBe(0);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees child window render passes when the root is deleted first',
  () => {
    const gc = testUtils.createGarbageCollector();
    const tracker = testUtils.trackWebGLObjects();
    const { rootRenderWindow, rootView, childRenderWindow, childView } =
      createChildViewSetup(gc);

    rootRenderWindow.render();
    expect(tracker.count()).toBeGreaterThan(0);

    // Deleting the root view deletes the whole view node tree with it. The
    // child views go down while the root can still reach the shared context,
    // and they must free their passes on the way out.
    expect(() => rootView.delete()).not.toThrow();
    expect(childView.isDeleted()).toBe(true);
    expect(tracker.count()).toBe(0);

    rootRenderWindow.delete();
    childRenderWindow.delete();
    gc.releaseResources();
  }
);

function createVolume(gc, image, colorTransferFunction, opacityFunction) {
  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setInputData(image);
  const volume = gc.registerResource(vtkVolume.newInstance());
  volume.setMapper(mapper);
  volume.getProperty().setRGBTransferFunction(0, colorTransferFunction);
  volume.getProperty().setScalarOpacity(0, opacityFunction);
  return volume;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'preserves shared textures after context release and volume removal',
  async ({ onTestFinished }) => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view, emptySceneObjects } =
      createTrackedRenderView(gc);

    const image = testUtils.createImage([8, 8, 8], [1, 1, 1]);
    const [low, high] = image.getPointData().getScalars().getRange();
    const color = gc.registerResource(vtkColorTransferFunction.newInstance());
    color.addRGBPoint(low, 0, 0, 1);
    color.addRGBPoint(high, 1, 0.5, 0);
    const opacity = gc.registerResource(vtkPiecewiseFunction.newInstance());
    opacity.addPoint(low, 0);
    opacity.addPoint(high, 1);

    const volume = createVolume(gc, image, color, opacity);
    renderer.addVolume(volume);
    renderer.resetCamera();
    const volumeAlone = view.captureNextImage();
    renderWindow.render();

    const sharingVolume = createVolume(gc, image, color, opacity);
    renderer.addVolume(sharingVolume);
    renderWindow.render();
    const objectsInUse = tracker.count();

    view.releaseGraphicsResources();
    expect(view.getGraphicsMemoryInfo()).toBe(0);
    renderWindow.render();
    expect(tracker.count()).toBe(objectsInUse);

    const createTexture = vi.spyOn(view.getContext(), 'createTexture');
    onTestFinished(() => createTexture.mockRestore());
    renderer.removeVolume(sharingVolume);
    const afterRemoval = view.captureNextImage();
    renderWindow.render();
    expect(createTexture).not.toHaveBeenCalled();
    expect(await afterRemoval).toBe(await volumeAlone);

    renderer.removeVolume(volume);
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);
  }
);
