import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkTextActor from 'vtk.js/Sources/Rendering/Core/TextActor';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from './testTextActor.png';

test.onlyIfWebGL('Test TextActor', (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'vtkTextActor');

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

  const actor = gc.registerResource(vtkTextActor.newInstance());
  actor.getProperty().setResolution(100);
  actor.setDisplayPosition(20, 30);
  actor.setInput('vtk.js');

  renderer.addActor2D(actor);
  renderer.resetCamera();

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
        'Rendering/Core/TextActor',
        t,
        1
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
