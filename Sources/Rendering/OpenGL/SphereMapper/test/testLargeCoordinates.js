/* eslint-disable no-await-in-loop */
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';

import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import baseline1 from './testLargeCoordinates1.png';
import baseline2 from './testLargeCoordinates2.png';

test.onlyIfWebGL('Test vtkSphereMapper large coordinates', async (t) => {
  const gc = testUtils.createGarbageCollector();
  t.ok('Rendering', 'vtkSphereMapper: large coordinates');

  // Create come control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  const X = 9000000;
  const planeSource = gc.registerResource(
    vtkPlaneSource.newInstance({
      point1: [1 + X, 0, 0],
      point2: [0 + X, 1, 0],
      origin: [X, 0, 0],
    })
  );
  const mapper = gc.registerResource(vtkSphereMapper.newInstance());
  const actor = gc.registerResource(vtkActor.newInstance());

  actor.setMapper(mapper);
  mapper.setInputConnection(planeSource.getOutputPort());

  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderer.addActor(actor);
  renderer.resetCamera();

  function testBaseline(baseline, azimuth) {
    renderer.getActiveCamera().azimuth(azimuth);
    renderer.resetCameraClippingRange();
    const promise = glwindow
      .captureNextImage()
      .then((image) =>
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/OpenGL/SphereMapper/',
          t,
          0.5
        )
      );
    renderWindow.render();
    return promise;
  }

  await [
    [baseline1, -4],
    [baseline2, -8],
  ]
    .reduce(
      (p, [baseline, azimuth]) => p.then(() => testBaseline(baseline, azimuth)),
      Promise.resolve()
    )
    .finally(() => {
      gc.releaseResources();
    });
});
