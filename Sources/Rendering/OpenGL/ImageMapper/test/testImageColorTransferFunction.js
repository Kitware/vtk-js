import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';

import baseline from './testImageColorTransferFunction.png';

test.onlyIfWebGL('Test ImageMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLImageMapper testImage');

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

  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputConnection(gridSource.getOutputPort());

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

  // create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/OpenGL/ImageMapper',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
