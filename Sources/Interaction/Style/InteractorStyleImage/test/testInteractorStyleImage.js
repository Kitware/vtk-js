import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

test('Test vtkInteractorStyleImage.setCurrentImageNumber', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);
  const grw = gc.registerResource(vtkGenericRenderWindow.newInstance());
  grw.setContainer(renderWindowContainer);
  grw.resize();

  const renderer = grw.getRenderer();
  const interactor = grw.getInteractor();
  interactor.setEnabled(false);

  const interactorStyle = gc.registerResource(
    vtkInteractorStyleImage.newInstance()
  );
  interactor.setInteractorStyle(interactorStyle);

  const imageSlices = [];
  for (let i = 0; i < 5; ++i) {
    const imageMapper = gc.registerResource(vtkImageMapper.newInstance());
    const imageActor = gc.registerResource(vtkImageSlice.newInstance());
    imageActor.setMapper(imageMapper);
    imageSlices.push(imageActor);
  }
  const widgetManager = gc.registerResource(vtkWidgetManager.newInstance());
  widgetManager.setRenderer(renderer);

  // Populate renderer with props other than image slice.
  renderer.addActor(gc.registerResource(vtkActor.newInstance()));
  const widgetFactory = gc.registerResource(vtkSplineWidget.newInstance());

  widgetManager.addWidget(widgetFactory); // Adds a widget in the renderer

  renderer.addActor(imageSlices[0]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(gc.registerResource(vtkActor.newInstance()));
  renderer.addActor(imageSlices[1]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(gc.registerResource(vtkActor.newInstance()));
  renderer.addActor(imageSlices[2]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(gc.registerResource(vtkActor.newInstance()));
  renderer.addActor(imageSlices[3]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(gc.registerResource(vtkActor.newInstance()));
  renderer.addActor(imageSlices[4]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(gc.registerResource(vtkActor.newInstance()));

  // Test setCurrentImageNumber()
  interactorStyle.setCurrentImageNumber(0);
  t.equal(
    interactorStyle.getCurrentImageProperty(),
    imageSlices[0].getProperty()
  );
  interactorStyle.setCurrentImageNumber(1);
  t.equal(
    interactorStyle.getCurrentImageProperty(),
    imageSlices[1].getProperty()
  );
  interactorStyle.setCurrentImageNumber(4);
  t.equal(
    interactorStyle.getCurrentImageProperty(),
    imageSlices[4].getProperty()
  );
  interactorStyle.setCurrentImageNumber(-1);
  t.equal(
    interactorStyle.getCurrentImageProperty(),
    imageSlices[4].getProperty()
  );
  interactorStyle.setCurrentImageNumber(-2);
  t.equal(
    interactorStyle.getCurrentImageProperty(),
    imageSlices[3].getProperty()
  );

  // release resources and end test
  gc.releaseResources();
});
