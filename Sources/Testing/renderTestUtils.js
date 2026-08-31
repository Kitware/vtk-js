import { expect } from 'vitest';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

// An opacity below one routes the actor through the translucent pass, which
// owns a framebuffer and its attachments.
export function createConeActor(gc, { opacity = 1 } = {}) {
  const cone = gc.registerResource(vtkConeSource.newInstance());
  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(cone.getOutputPort());
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);
  actor.getProperty().setOpacity(opacity);
  return actor;
}

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

// A post processing pass renders its delegate into a framebuffer it owns.
// Translucency puts resources on the delegated forward pass too, so releasing
// one has to reach through the delegate chain and not just the pass itself.
export function usePostProcessingPass(gc, view, createPass) {
  const pass = createPass(gc);
  pass.setDelegates([gc.registerResource(vtkForwardPass.newInstance())]);
  view.setRenderPasses([pass]);
  return pass;
}

// Deleting a view that renders through a post processing pass must leave no
// GPU object behind.
export function expectPassResourcesFreedOnDelete(createPass) {
  const gc = testUtils.createGarbageCollector();
  const { tracker, renderer, renderWindow, view, emptySceneObjects } =
    createTrackedRenderView(gc);

  usePostProcessingPass(gc, view, createPass);
  renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
  renderer.resetCamera();
  renderWindow.render();
  expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

  gc.releaseResources();
  expect(tracker.count()).toBe(0);
}

// Releasing a view's render pass resources must not change what it draws next.
export async function expectSameImageAfterPassRelease(createPass) {
  const gc = testUtils.createGarbageCollector();
  const { tracker, renderer, renderWindow, view, emptySceneObjects } =
    createTrackedRenderView(gc);

  usePostProcessingPass(gc, view, createPass);
  renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
  renderer.resetCamera();

  const beforeRelease = view.captureNextImage();
  renderWindow.render();
  expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

  view.releaseGraphicsResources();

  const afterRelease = view.captureNextImage();
  renderWindow.render();
  expect(await afterRelease).toBe(await beforeRelease);

  gc.releaseResources();
}
