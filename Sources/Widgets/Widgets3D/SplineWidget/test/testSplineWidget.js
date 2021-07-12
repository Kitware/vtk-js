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

  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(renderer);

  // Create 3 widgets:
  // - widget[0] is not visible but pickable
  // - widget[1] is visible and pickable
  // - widget[2] is visible but not pickable
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
  ];
  const widgets = [];

  widgetPoints.forEach((points) => {
    const widgetFactory = vtkSplineWidget.newInstance();
    const widget = widgetManager.addWidget(widgetFactory);
    widget.reset();
    points.forEach((point) => {
      const lastHandle = widgetFactory.getWidgetState().addHandle();
      lastHandle.setVisible(true);
      lastHandle.setOrigin(...point);
    });
    widget.setFill(true);
    widget.setOutputBorder(true);
    widgets.push(widget);
  });
  widgets[0].setVisibility(false);
  widgets[1].setBorderColor([0, 0, 1, 1]);
  widgets[2].setPickable(false);

  renderer.resetCamera();

  function testSelect() {
    const sel = glwindow.getSelector();

    sel.selectAsync(renderer, 200, 200, 210, 210).then((res) => {
      t.equal(res.length, 1);
      t.equal(res[0].getProperties().propID, 2);
      gc.releaseResources();
    });
  }

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Widgets/Widgets3D/SplineWidget/test/testSplineWidget',
      t,
      2.5,
      testSelect
    );
  });
  renderWindow.render();
});
