import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';

import baseline from './testMultipleRenderers.png';

test('Test multiple renderers', (t) => {
  const gc = testUtils.createGarbageCollector(t);

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());

  // Upper renderer
  const upperRenderer = gc.registerResource(vtkRenderer.newInstance());
  upperRenderer.setViewport(0, 0.5, 1, 1); // xmin, ymin, xmax, ymax
  renderWindow.addRenderer(upperRenderer);
  upperRenderer.setBackground(0.32, 0.34, 0.43);

  const coneActor = gc.registerResource(vtkActor.newInstance());
  upperRenderer.addActor(coneActor);

  const coneMapper = gc.registerResource(vtkMapper.newInstance());
  coneActor.setMapper(coneMapper);

  const coneSource = gc.registerResource(
    vtkConeSource.newInstance({ height: 1.0 })
  );
  coneMapper.setInputConnection(coneSource.getOutputPort());

  // Lower left renderer
  const lowerLeftRenderer = gc.registerResource(vtkRenderer.newInstance());
  lowerLeftRenderer.setViewport(0, 0, 0.5, 0.5); // xmin, ymin, xmax, ymax
  renderWindow.addRenderer(lowerLeftRenderer);
  lowerLeftRenderer.setBackground(0, 0.5, 0);

  const sphereActor = gc.registerResource(vtkActor.newInstance());
  lowerLeftRenderer.addActor(sphereActor);

  const sphereMapper = gc.registerResource(vtkMapper.newInstance());
  sphereActor.setMapper(sphereMapper);

  const sphereSource = gc.registerResource(vtkSphereSource.newInstance());
  sphereMapper.setInputConnection(sphereSource.getOutputPort());

  // Lower right renderer
  const lowerRightRenderer = gc.registerResource(vtkRenderer.newInstance());
  lowerRightRenderer.setViewport(0.5, 0, 1, 0.5); // xmin, ymin, xmax, ymax
  renderWindow.addRenderer(lowerRightRenderer);
  lowerRightRenderer.setBackground(0, 0, 0.5);

  const cubeActor = gc.registerResource(vtkActor.newInstance());
  lowerRightRenderer.addActor(cubeActor);

  const cubeMapper = gc.registerResource(vtkMapper.newInstance());
  cubeActor.setMapper(cubeMapper);

  const cubeSource = gc.registerResource(vtkCubeSource.newInstance());
  cubeMapper.setInputConnection(cubeSource.getOutputPort());

  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  upperRenderer.resetCamera();
  lowerLeftRenderer.resetCamera();
  lowerRightRenderer.resetCamera();

  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/RenderWindow/testMultipleRenderers',
      t,
      5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
