import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import { DisplayLocation } from 'vtk.js/Sources/Rendering/Core/Property2D/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

import baseline from './testActor2D.png';

test('Test Actor2D', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkActor2D');

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
  actor.getProperty().setColor([0, 0.3, 0.8]);
  actor.getProperty().setOpacity(1.0);
  renderer.addActor(actor);

  const actor2D = gc.registerResource(vtkActor2D.newInstance());
  actor2D.getProperty().setColor([0.5, 0.8, 0]);
  actor2D.getProperty().setOpacity(0.3);
  actor2D.getProperty().setDisplayLocation(DisplayLocation.FOREGROUND);
  actor2D.getProperty().setRepresentation(Representation.SURFACE);
  renderer.addActor2D(actor2D);
  const actor2D1 = gc.registerResource(vtkActor2D.newInstance());
  actor2D1.getProperty().setColor([0.1, 0.8, 0.5]);
  actor2D1.getProperty().setDisplayLocation(DisplayLocation.BACKGROUND);
  actor2D1.getProperty().setRepresentation(Representation.SURFACE);
  renderer.addActor2D(actor2D1);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);
  const mapper2D = gc.registerResource(vtkMapper2D.newInstance());
  const mapper2D1 = gc.registerResource(vtkMapper2D.newInstance());
  const c = vtkCoordinate.newInstance();
  c.setCoordinateSystemToWorld();
  mapper2D.setTransformCoordinate(c);
  mapper2D.setScalarVisibility(false);
  actor2D.setMapper(mapper2D);
  mapper2D1.setTransformCoordinate(c);
  mapper2D1.setScalarVisibility(false);
  actor2D1.setMapper(mapper2D1);

  const cubeSource = gc.registerResource(vtkCubeSource.newInstance());
  mapper.setInputConnection(cubeSource.getOutputPort());
  const sphereSource = gc.registerResource(vtkSphereSource.newInstance());
  sphereSource.setCenter(-0.5, 0.0, 0.0);
  sphereSource.setRadius(0.3);
  sphereSource.setThetaResolution(25);
  sphereSource.setPhiResolution(25);
  mapper2D.setInputConnection(sphereSource.getOutputPort());
  const sphereSource1 = gc.registerResource(vtkSphereSource.newInstance());
  sphereSource1.setCenter(0.5, -0.3, 0.0);
  sphereSource1.setRadius(0.3);
  sphereSource1.setThetaResolution(30);
  sphereSource1.setPhiResolution(30);
  mapper2D1.setInputConnection(sphereSource1.getOutputPort());

  renderer.getActiveCamera().azimuth(25);
  renderer.getActiveCamera().roll(25);
  renderer.resetCamera();

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/Actor2D/testActor2D.js',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
