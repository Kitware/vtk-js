import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import baseline from './testSplineWidget.png';

test.onlyIfWebGL('Test vtkSplineWidget rendering and picking', (t) => {
  const gc = testUtils.createGarbageCollector(t);

  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  const interactor = gc.registerResource(
    vtkRenderWindowInteractor.newInstance()
  );
  renderWindow.setInteractor(interactor);
  interactor.setView(glwindow);
  interactor.initialize();

  const widgetManager = gc.registerResource(vtkWidgetManager.newInstance());
  widgetManager.setRenderer(renderer);

  // Create 4 widgets:
  // - widget[0] is visible, pickable and area pickable
  // - widget[1] is not visible, pickable and area pickable
  // - widget[2] is visible, pickable but not area pickable (default)
  // - widget[3] is visible, not pickable but area pickable
  const widgetPoints = [
    [
      [-1, 0, 0],
      [-1, 1, 0],
      [0, 0.5, 0],
      [1, -0.5, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 0.5, 0],
      [-1, -0.5, 0],
    ],
    [
      [1, 0, 0],
      [1, -1, 0],
      [0, -0.5, 0],
      [-1, 0.5, 0],
    ],
    [
      [-1, 0, 0],
      [-1, -1, 0],
      [0, -0.5, 0],
      [1, 0.5, 0],
    ],
  ];
  const widgets = widgetPoints.map((points) => {
    const widgetFactory = vtkSplineWidget.newInstance();
    const widget = widgetManager.addWidget(widgetFactory);
    widget.reset();
    points.forEach((point) => {
      const lastHandle = widgetFactory.getWidgetState().addHandle();
      lastHandle.setOrigin(...point);
    });
    widget.setFill(true);
    widget.setOutputBorder(true);
    return widget;
  });
  // - widget[0] is visible, pickable and area pickable
  widgets[0].setBorderColor(1, 0, 0);
  widgets[0].getRepresentations()[1].setPickable(true);

  // - widget[1] is not visible, pickable and area pickable
  widgets[1].setBorderColor(0, 0, 1);
  widgets[1].setVisibility(false);
  widgets[1].getRepresentations()[1].setPickable(true);

  // - widget[2] is visible, pickable but not area pickable (default)
  widgets[2].setBorderColor(0, 1, 1);

  // - widget[3] is visible, not pickable but area pickable
  widgets[3].setBorderColor(1, 0, 1);
  widgets[3].setPickable(false);
  widgets[3].getRepresentations()[1].setPickable(true);

  widgets.forEach((widget) => widget.getWidgetState().modified());

  renderer.resetCamera();

  function testRender() {
    let resolve;
    const promise = new Promise((res) => {
      console.log('resolved');
      resolve = res;
    });
    glwindow.captureNextImage().then((image) => {
      testUtils.compareImages(
        image,
        [baseline],
        'Widgets/Widgets3D/SplineWidget/test/testSplineWidget',
        t,
        2.5,
        resolve
      );
    });
    // Trigger a next image
    renderWindow.render();
    return promise;
  }

  function testSelect() {
    const sel = glwindow.getSelector();

    return sel.selectAsync(renderer, 200, 200, 210, 210).then((res) => {
      t.equal(res.length, 1);
      t.equal(
        res[0].getProperties().prop.getParentProp(),
        widgets[0].getRepresentations()[1]
      );
    });
  }

  [testRender, testSelect, gc.releaseResources].reduce(
    (current, next) => current.then(next),
    Promise.resolve()
  );
});
