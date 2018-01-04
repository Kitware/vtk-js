import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

test('Test vtkCoordinate publicAPI', (t) => {
  const gc = testUtils.createGarbageCollector(t);

  const testGetters = (
    coords,
    ren,
    value,
    world,
    display,
    localDisplay,
    viewPort
  ) => {
    coords.setValue(value);
    const currWorld = coords.getComputedWorldValue(ren);
    const v0 = Number(
      parseFloat(Math.round(currWorld[0] * 100) / 100).toFixed(2)
    );
    const v1 = Number(
      parseFloat(Math.round(currWorld[1] * 100) / 100).toFixed(2)
    );
    const v2 = Number(
      parseFloat(Math.round(currWorld[2] * 100) / 100).toFixed(2)
    );
    t.deepEqual([v0, v1, v2], world);

    const currDisplay = coords.getComputedDisplayValue(ren);
    t.deepEqual(currDisplay, display);

    const currLocalDisplay = coords.getComputedLocalDisplayValue(ren);
    t.deepEqual(currLocalDisplay, localDisplay);

    const currViewPort = coords.getComputedViewportValue(ren);
    t.deepEqual(currViewPort, viewPort);
  };

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

  const cam = vtkCamera.newInstance();
  renderer.setActiveCamera(cam);

  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(100, 100);

  const coord = vtkCoordinate.newInstance();

  // --------------------- No renderer
  coord.setCoordinateSystemToWorld();
  let testVal = [0.0, 0.0, 0.0];
  let world = [0.0, 0.0, 0.0];
  let display = [50.0, 50.0];
  let localDisplay = [50.0, 49.0];
  let viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToDisplay();
  testVal = [50.0, 50.0, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToNormalizedDisplay();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToViewport();
  testVal = [50.0, 50.0, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToNormalizedViewport();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToView();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 0.98];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  // --------------------- Add a specific renderer
  coord.setRenderer(renderer);

  coord.setCoordinateSystemToWorld();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 0.0];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToDisplay();
  testVal = [50.0, 50.0, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToNormalizedDisplay();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToViewport();
  testVal = [50.0, 50.0, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToNormalizedViewport();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToView();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 0.98];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  // --------------------- Add a reference coordinate
  const coordRef = vtkCoordinate.newInstance();
  coordRef.setCoordinateSystemToWorld();
  coordRef.setValue(0.0, 0.0, 0.0);

  coord.setReferenceCoordinate(coordRef);

  coord.setCoordinateSystemToWorld();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 0.0];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToDisplay();
  testVal = [50.0, 50.0, 0.0];
  world = [0, 0, 0.99];
  display = [100.0, 100.0];
  localDisplay = [100.0, -1.0];
  viewPort = [100.0, 100.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToNormalizedDisplay();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [100.0, 100.0];
  localDisplay = [100.0, -1.0];
  viewPort = [100.0, 100.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToViewport();
  testVal = [50.0, 50.0, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [100.0, 100.0];
  localDisplay = [100.0, -1.0];
  viewPort = [100.0, 100.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToNormalizedViewport();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [99.0, 99.0];
  localDisplay = [99.0, 0.0];
  viewPort = [99.0, 99.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  coord.setCoordinateSystemToView();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 0.99];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  t.end();
});
