import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCollection from 'vtk.js/Sources/Common/DataModel/Collection';
import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageArrayMapper from 'vtk.js/Sources/Rendering/Core/ImageArrayMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from '../../ImageMapper/test/testImage.png';

test('Test ImageArrayMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkImageArrayMapper testImage');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const gridSource = gc.registerResource(vtkImageGridSource.newInstance());
  gridSource.setDataExtent(0, 200, 0, 200, 0, 0);
  gridSource.setGridSpacing(16, 16, 0);
  gridSource.setGridOrigin(8, 8, 0);
  gridSource.setDataDirection(0.866, 0.5, 0, -0.5, 0.866, 0, 0, 0, 1);
  // gridSource.update();

  const collection = gc.registerResource(vtkCollection.newInstance());
  collection.addItem(gridSource.getOutputData());

  const mapper = gc.registerResource(vtkImageArrayMapper.newInstance());
  mapper.setInputData(collection);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.getProperty().setColorWindow(255);
  actor.getProperty().setColorLevel(127);
  actor.setMapper(mapper);

  renderer.addActor(actor);
  renderer.resetCamera();
  renderWindow.render();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/ImageArrayMapper',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
