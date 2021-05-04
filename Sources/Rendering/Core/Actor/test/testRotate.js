import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from './testRotate.png';

test('Test Actor', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkActor testRotate');

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

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const planeSource = gc.registerResource(vtkPlaneSource.newInstance());
  const mapper = gc.registerResource(vtkMapper.newInstance());
  const actor = gc.registerResource(vtkActor.newInstance());

  mapper.setInputConnection(planeSource.getOutputPort());
  actor.setMapper(mapper);
  actor.rotateZ(15);
  actor.rotateX(60);

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
      'Rendering/Core/Actor',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
