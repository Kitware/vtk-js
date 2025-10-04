import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRegularPolygonSource from 'vtk.js/Sources/Filters/Sources/RegularPolygonSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

import baseline from './testRegularPolygon.png';

test.onlyIfWebGL('Test vtkRegularPolygonSource Rendering', (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('rendering', 'vtkRegularPolygonSource Rendering');

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
  actor.getProperty().setRepresentation(Representation.WIREFRAME);

  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const regularPolygonSource = gc.registerResource(
    vtkRegularPolygonSource.newInstance()
  );
  mapper.setInputConnection(regularPolygonSource.getOutputPort());

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
        'Filters/Sources/regularPolygonSource/testRegularPolygon',
        t,
        2.5
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
