import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPointSource from 'vtk.js/Sources/Filters/Sources/PointSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import basepoint from './testPointSource.png';

it.skipIf(__VTK_TEST_NO_WEBGL__)('Test vtkPointSource Rendering', () => {
  const gc = testUtils.createGarbageCollector();
  expect('rendering', 'vtkPointSource Rendering').toBeTruthy();

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
  actor.getProperty().setPointSize(5);
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const PointSource = gc.registerResource(
    vtkPointSource.newInstance({ numberOfPoints: 125, radius: 0.75 })
  );
  vtkMath.randomSeed(141592);
  PointSource.update();
  mapper.setInputConnection(PointSource.getOutputPort());

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
        [basepoint],
        'Filters/Sources/PointSource/testPointSource',
        1.0
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
