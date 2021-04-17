import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './baseline.png';

test.onlyIfWebGL('Test vtkLineSource Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkLineSource Rendering');

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

  const lineSource = gc.registerResource(
    vtkLineSource.newInstance({ resolution: 10 })
  );
  mapper.setInputConnection(lineSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Filters/Sources/LineSource/testLine',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
