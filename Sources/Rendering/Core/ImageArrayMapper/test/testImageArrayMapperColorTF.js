import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCollection from 'vtk.js/Sources/Common/DataModel/Collection';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageArrayMapper from 'vtk.js/Sources/Rendering/Core/ImageArrayMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from '../../ImageMapper/test/testImageColorTransferFunction.png';

test.onlyIfWebGL('Test ImageArrayMapper Color TFun', (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'vtkImageArrayMapper Color Transfer Function testImage');

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
  gridSource.setDataExtent(0, 20, 0, 20, 0, 0);
  gridSource.setGridSpacing(16, 16, 0);
  gridSource.setGridOrigin(8, 8, 0);
  gridSource.setDataDirection(0.866, 0.5, 0, -0.5, 0.866, 0, 0, 0, 1);
  const collection = gc.registerResource(vtkCollection.newInstance());
  collection.addItem(gridSource.getOutputData());

  const mapper = gc.registerResource(vtkImageArrayMapper.newInstance());
  mapper.setInputData(collection);

  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(-255, 1.0, 0, 0);
  ctfun.addRGBPoint(0, 0.0, 0, 1.0);
  ctfun.addRGBPoint(255, 0.0, 1.0, 0.0);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  const property = actor.getProperty();
  property.setRGBTransferFunction(ctfun);
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

  const promise = glwindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [baseline],
        'Rendering/Core/ImageArrayMapper',
        t,
        5.0
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
