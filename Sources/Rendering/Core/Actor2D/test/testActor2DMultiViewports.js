import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import { DisplayLocation } from 'vtk.js/Sources/Rendering/Core/Property2D/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

import baseline from './testActor2DMultiViewports.png';

test('Test Actor2D MultiViewports', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkActor2D MultiViewports');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  function createActors2D(renderer, g) {
    const actor2D = g.registerResource(vtkActor2D.newInstance());
    actor2D.getProperty().setColor([0.5, 0.6, 0.3]);
    actor2D.getProperty().setOpacity(0.3);
    actor2D.getProperty().setLineWidth(2);
    actor2D.getProperty().setDisplayLocation(DisplayLocation.FOREGROUND);
    actor2D.getProperty().setRepresentation(Representation.WIREFRAME);
    const mapper2D = g.registerResource(vtkMapper2D.newInstance());
    const c = vtkCoordinate.newInstance();
    c.setCoordinateSystemToWorld();
    mapper2D.setTransformCoordinate(c);
    mapper2D.setScalarVisibility(false);
    actor2D.setMapper(mapper2D);
    renderer.addActor2D(actor2D);
    const actor2D1 = g.registerResource(vtkActor2D.newInstance());
    actor2D1.getProperty().setColor([0.1, 0.8, 0.5]);
    actor2D1.getProperty().setDisplayLocation(DisplayLocation.BACKGROUND);
    actor2D1.getProperty().setRepresentation(Representation.SURFACE);
    const mapper2D1 = g.registerResource(vtkMapper2D.newInstance());
    mapper2D1.setTransformCoordinate(c);
    mapper2D1.setScalarVisibility(false);
    actor2D1.setMapper(mapper2D1);
    renderer.addActor2D(actor2D1);

    const cubeSource = g.registerResource(vtkCubeSource.newInstance());
    mapper2D.setInputConnection(cubeSource.getOutputPort());
    const sphereSource = g.registerResource(vtkSphereSource.newInstance());
    sphereSource.setCenter(0, 0.0, 0.0);
    sphereSource.setRadius(0.3);
    sphereSource.setThetaResolution(25);
    sphereSource.setPhiResolution(25);
    mapper2D1.setInputConnection(sphereSource.getOutputPort());
    renderer.resetCamera([-1, 1, -1, 1, -1, 1]);
  }

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const ren1 = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(ren1);
  ren1.setBackground(0.32, 0.34, 0.43);
  ren1.setViewport(0, 0.4, 0.6, 1.0);
  const ren2 = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(ren2);
  ren2.setBackground(0.1, 0.44, 0.23);
  ren2.setViewport(0, 0.0, 0.6, 0.4);
  const ren3 = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(ren3);
  ren3.setBackground(0.5, 0.14, 0.13);
  ren3.setViewport(0.6, 0.0, 1.0, 1.0);

  createActors2D(ren1, gc);
  createActors2D(ren2, gc);
  createActors2D(ren3, gc);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/Actor2D/testActor2DMultiViewport.js',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
