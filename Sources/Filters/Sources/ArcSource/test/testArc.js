import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkArcSource from 'vtk.js/Sources/Filters/Sources/ArcSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './testArc.png';

test.onlyIfWebGL('Test testArc Rendering', (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'testArc Rendering');

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

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const arcSource = gc.registerResource(vtkArcSource.newInstance());
  mapper.setInputConnection(arcSource.getOutputPort());

  // now create something to view it, in this case webgl
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
        'Filters/Sources/ArcSource/testArc',
        t,
        2.5
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
