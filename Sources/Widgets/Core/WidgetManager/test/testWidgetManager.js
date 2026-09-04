import { expect, it } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import { CaptureOn } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

import noScaleInPixelsWithPerspectiveBaseline from './testNoScaleInPixelsWithPerspectiveBaseline.png';
import noScaleInPixelsWithParallelBaseline from './testNoScaleInPixelsWithParallelBaseline.png';

import scaleInPixelsWithPerspectiveBaseline from './testScaleInPixelsWithPerspectiveBaseline.png';
import scaleInPixelsWithParallelBaseline from './testScaleInPixelsWithParallelBaseline.png';

it('Test vtkWidgetManager', () => {
  const container = document.querySelector('body');
  const rwContainer = document.createElement('div');
  container.appendChild(rwContainer);
  const grw = vtkGenericRenderWindow.newInstance({ listenWindowResize: false });
  grw.setContainer(rwContainer);

  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(grw.getRenderer());

  const widget = vtkPolyLineWidget.newInstance();
  widgetManager.addWidget(widget);
  widgetManager.getState();

  container.removeChild(rwContainer);
});

it.skipIf(__VTK_TEST_NO_WEBGL__)('Test getPixelWorldHeightAtCoord', () => {
  const gc = testUtils.createGarbageCollector();

  const container = document.querySelector('body');
  const rwContainer = gc.registerDOMElement(document.createElement('div'));
  // maintain consistent container size across browsers
  rwContainer.style.width = '300px';
  rwContainer.style.height = '300px';

  container.appendChild(rwContainer);

  const grw = vtkGenericRenderWindow.newInstance({ listenWindowResize: false });
  grw.setContainer(rwContainer);

  const widgetManager = gc.registerResource(vtkWidgetManager.newInstance());
  widgetManager.setRenderer(grw.getRenderer());

  const widget = vtkPolyLineWidget.newInstance();
  const viewWidget = widgetManager.addWidget(widget);
  widget.getWidgetState().addHandle().setOrigin([-10, 50, 100]);
  const handle1 = widget.getWidgetState().addHandle();
  handle1.setOrigin([10, 50, 100]);
  handle1.setScale1(300); // fill total height
  widget.getWidgetState().addHandle().setOrigin([30, 50, 300]);

  const camera = grw.getRenderer().getActiveCamera();
  camera.setPosition(10, 50, 400);
  camera.setFocalPoint(10, 50, 100);
  grw.getInteractor().render();

  function testNoScaleInPixelsWithPerspective() {
    viewWidget.setScaleInPixels(false);
    camera.setParallelProjection(false);
    camera.setParallelScale(1);

    const promise = grw
      .getApiSpecificRenderWindow()
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [noScaleInPixelsWithPerspectiveBaseline],
          'Widgets/Core/WidgetManager/test/testNoScaleInPixelsWithPerspective',
          0.5
        )
      );
    // Trigger a next image
    grw.getInteractor().render();
    return promise;
  }

  function testNoScaleInPixelsWithParallel() {
    viewWidget.setScaleInPixels(false);
    camera.setParallelProjection(true);
    camera.setParallelScale(100);

    const promise = grw
      .getApiSpecificRenderWindow()
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [noScaleInPixelsWithParallelBaseline],
          'Widgets/Core/WidgetManager/test/testNoScaleInPixelsWithParallel',
          0.5
        )
      );
    // Trigger a next image
    grw.getInteractor().render();
    return promise;
  }

  function testScaleInPixelsWithPerspective() {
    viewWidget.setScaleInPixels(true);
    camera.setParallelProjection(false);
    camera.setParallelScale(1);

    const promise = grw
      .getApiSpecificRenderWindow()
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [scaleInPixelsWithPerspectiveBaseline],
          'Widgets/Core/WidgetManager/test/testScaleInPixelsWithPerspective',
          0.5
        )
      );
    // Trigger a next image
    grw.getInteractor().render();
    return promise;
  }

  function testScaleInPixelsWithParallel() {
    viewWidget.setScaleInPixels(true);
    camera.setParallelProjection(true);
    camera.setParallelScale(100);

    const promise = grw
      .getApiSpecificRenderWindow()
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [scaleInPixelsWithParallelBaseline],
          'Widgets/Core/WidgetManager/test/scaleInPixelsWithParallel',
          0.5
        )
      );
    // Trigger a next image
    grw.getInteractor().render();
    return promise;
  }

  return [
    testNoScaleInPixelsWithPerspective,
    testNoScaleInPixelsWithParallel,
    testScaleInPixelsWithPerspective,
    testScaleInPixelsWithParallel,
  ]
    .reduce((current, next) => current.then(next), Promise.resolve())
    .finally(gc.releaseResources);
});

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'cleans up an in-flight selection and its view widgets when deleted',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);
    const widget = gc.registerResource(vtkPolyLineWidget.newInstance());
    const viewWidget = widgetManager.addWidget(widget);
    renderWindow.render();

    const selection = widgetManager.getSelectedDataForXY(0, 0);
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);

    // application teardown order: manager first, with a selection in flight
    widgetManager.delete();
    await expect(selection).resolves.toEqual({});

    expect(renderer.getActors()).not.toContain(viewWidget);
    expect(widget.getViewIds()).toEqual([]);

    // the view tree frees removed actors on the next render
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);
    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'releases the selector owned for a previous renderer',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);
    await widgetManager.getSelectedDataForXY(0, 0);
    const selectorObjects = tracker.count();
    expect(selectorObjects).toBeGreaterThan(emptySceneObjects);

    // same-renderer setRenderer is still a full re-wire and releases the
    // selector built for the previous wiring
    widgetManager.setRenderer(renderer);
    expect(tracker.count()).toBe(emptySceneObjects);
    expect(widgetManager.get('_camera')._camera).toBe(
      renderer.getActiveCamera()
    );

    const otherRenderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(otherRenderer);
    // create the view node the selector will pick against
    renderWindow.render();
    widgetManager.setRenderer(otherRenderer);
    expect(tracker.count()).toBe(emptySceneObjects);

    await widgetManager.getSelectedDataForXY(0, 0);
    expect(tracker.count()).toBeGreaterThan(emptySceneObjects);
    widgetManager.delete();
    expect(tracker.count()).toBe(emptySceneObjects);

    renderWindow.removeRenderer(otherRenderer);
    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'does not start a picking capture while deleting a focused widget',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const widgetManager = vtkWidgetManager.newInstance({
      captureOn: CaptureOn.MOUSE_RELEASE,
    });
    widgetManager.setRenderer(renderer);
    const widget = gc.registerResource(vtkPolyLineWidget.newInstance());
    widgetManager.addWidget(widget);
    renderWindow.render();

    // settle the initial capture so nothing in flight defers selector deletion
    await widgetManager.getSelectedDataForXY(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // deleting while focused would otherwise start a MOUSE_RELEASE capture
    // and defer freeing the selector behind it
    widgetManager.grabFocus(widget);
    const beforeDelete = tracker.count();

    widgetManager.delete();
    expect(tracker.count()).toBeLessThan(beforeDelete);

    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);
    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'completes teardown when the view is deleted before a focused manager',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const tracker = testUtils.trackWebGLObjects();

    const genericRenderWindow = vtkGenericRenderWindow.newInstance({
      listenWindowResize: false,
    });
    genericRenderWindow.setContainer(testUtils.createRenderContainer(gc));
    genericRenderWindow.resize();
    const renderer = genericRenderWindow.getRenderer();
    const renderWindow = genericRenderWindow.getRenderWindow();
    renderWindow.render();
    const emptySceneObjects = tracker.count();

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);
    const widget = gc.registerResource(vtkPolyLineWidget.newInstance());
    widgetManager.addWidget(widget);
    renderWindow.render();

    await widgetManager.getSelectedDataForXY(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const interactor = renderWindow.getInteractor();
    widgetManager.grabFocus(widget);
    expect(interactor.isAnimating()).toBe(true);

    // an application that disposes the view before its widget manager
    genericRenderWindow.delete();
    widgetManager.delete();

    expect(widgetManager.isDeleted()).toBe(true);
    expect(interactor.isAnimating()).toBe(false);
    expect(tracker.count()).toBe(emptySceneObjects);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'drops the animation request of a focused widget deleted before the manager',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, emptySceneObjects } =
      createTrackedRenderView(gc);

    const widgetManager = vtkWidgetManager.newInstance();
    widgetManager.setRenderer(renderer);
    const widget = gc.registerResource(vtkPolyLineWidget.newInstance());
    const viewWidget = widgetManager.addWidget(widget);
    renderWindow.render();

    await widgetManager.getSelectedDataForXY(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const interactor = renderWindow.getInteractor();
    widgetManager.grabFocus(widget);
    expect(interactor.isAnimating()).toBe(true);

    // the widget cannot cancel its own request once deleted
    viewWidget.delete();
    widgetManager.delete();

    expect(widgetManager.isDeleted()).toBe(true);
    expect(interactor.isAnimating()).toBe(false);
    renderWindow.render();
    expect(tracker.count()).toBe(emptySceneObjects);
  }
);
