import { expect } from 'vitest';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

// A tracked view that has rendered an empty scene: any count beyond
// emptySceneObjects belongs to the code under test.
export function createTrackedRenderView(gc, initialValues = {}) {
  const tracker = testUtils.trackWebGLObjects();
  const genericRenderWindow = gc.registerResource(
    vtkGenericRenderWindow.newInstance({
      listenWindowResize: false,
      ...initialValues,
    })
  );
  genericRenderWindow.setContainer(testUtils.createRenderContainer(gc));
  genericRenderWindow.resize();
  const renderer = genericRenderWindow.getRenderer();
  const renderWindow = genericRenderWindow.getRenderWindow();
  const view = genericRenderWindow.getApiSpecificRenderWindow();
  renderWindow.render();
  const emptySceneObjects = tracker.count();
  return { tracker, renderer, renderWindow, view, emptySceneObjects };
}

// Releasing a mapper's resources must leave no GPU object behind and must not
// change what the next render draws.
export async function expectSameImageAfterRelease(createActor) {
  const gc = testUtils.createGarbageCollector();
  const { tracker, renderer, renderWindow, view, emptySceneObjects } =
    createTrackedRenderView(gc);

  const actor = createActor(gc);
  renderer.addActor(actor);
  renderer.resetCamera();
  const beforeRelease = view.captureNextImage();
  renderWindow.render();
  expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

  view.getViewNodeFor(actor.getMapper()).releaseGraphicsResources(view);
  expect(tracker.count()).toBe(emptySceneObjects);

  const afterRelease = view.captureNextImage();
  renderWindow.render();
  expect(tracker.count()).toBeGreaterThan(emptySceneObjects);
  expect(await afterRelease).toBe(await beforeRelease);

  gc.releaseResources();
}
