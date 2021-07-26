import test from 'tape-catch';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget';
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager';

test('Test vtkInteractorStyleImage.setCurrentImageNumber', (t) => {
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);
  const grw = vtkGenericRenderWindow.newInstance();
  grw.setContainer(renderWindowContainer);
  grw.resize();

  const renderer = grw.getRenderer();
  const interactor = grw.getInteractor();
  interactor.setEnabled(false);

  const interactorStyle = vtkInteractorStyleImage.newInstance();
  interactor.setInteractorStyle(interactorStyle);

  const imageSlices = [];
  for (let i = 0; i < 5; ++i) {
    const imageMapper = vtkImageMapper.newInstance();
    const imageActor = vtkImageSlice.newInstance();
    imageActor.setMapper(imageMapper);
    imageSlices.push(imageActor);
  }
  const widgetManager = vtkWidgetManager.newInstance();
  widgetManager.setRenderer(renderer);

  // Populate renderer with props other than image slice.
  renderer.addActor(vtkActor.newInstance());
  const widgetFactory = vtkSplineWidget.newInstance();

  widgetManager.addWidget(widgetFactory); // Adds a widget in the renderer

  renderer.addActor(imageSlices[0]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(vtkActor.newInstance());
  renderer.addActor(imageSlices[1]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(vtkActor.newInstance());
  renderer.addActor(imageSlices[2]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(vtkActor.newInstance());
  renderer.addActor(imageSlices[3]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(vtkActor.newInstance());
  renderer.addActor(imageSlices[4]);
  widgetManager.addWidget(widgetFactory);
  renderer.addActor(vtkActor.newInstance());

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
  t.end();
});
