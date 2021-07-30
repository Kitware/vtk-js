import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
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

  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
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
  world = [0.0, 0.0, 1.0];
  display = [50.0, 50.0];
  localDisplay = [50.0, 49.0];
  viewPort = [50.0, 50.0];
  testGetters(coord, renderer, testVal, world, display, localDisplay, viewPort);

  // --------------------- Multi Renderers
  // In my previous test, some view ports were normal and some not. so create a 2x2 grid view to test.
  const renderers = new Array(4);
  for (let i = 0; i < renderers.length; i++) {
    const ren = gc.registerResource(vtkRenderer.newInstance());
    /* index order
    0 1
    2 3
    */
    const x = (i % 2) * 0.5;
    const y = 1 - Math.floor(i / 2) * 0.5;
    ren.setViewport(x, y - 0.5, x + 0.5, y);
    ren.setActiveCamera(vtkCamera.newInstance());
    renderWindow.addRenderer(ren);
    renderers[i] = ren;
  }

  coord.setCoordinateSystemToWorld();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 0.0];
  let displays = [
    [25.0, 75.0],
    [75.0, 75.0],
    [25.0, 25.0],
    [75.0, 25.0],
  ];
  let localDisplays = [
    [25.0, 24.0],
    [75.0, 24.0],
    [25.0, 74.0],
    [75.0, 74.0],
  ];
  viewPort = [25.0, 25.0];

  for (let i = 0; i < renderers.length; i++) {
    testGetters(
      coord,
      renderers[i],
      testVal,
      world,
      displays[i],
      localDisplays[i],
      viewPort
    );
  }

  coord.setCoordinateSystemToDisplay();
  testVal = [
    [25.0, 75.0],
    [75.0, 75.0],
    [25.0, 25.0],
    [75.0, 25.0],
  ];
  world = [0.0, 0.0, 0.99];
  displays = [
    [25.0, 75.0],
    [75.0, 75.0],
    [25.0, 25.0],
    [75.0, 25.0],
  ];
  localDisplays = [
    [25.0, 24.0],
    [75.0, 24.0],
    [25.0, 74.0],
    [75.0, 74.0],
  ];
  viewPort = [25.0, 25.0];
  for (let i = 0; i < renderers.length; i++) {
    testGetters(
      coord,
      renderers[i],
      testVal[i],
      world,
      displays[i],
      localDisplays[i],
      viewPort
    );
  }

  coord.setCoordinateSystemToViewport();
  testVal = [25.0, 25.0, 0.0];
  world = [0.0, 0.0, 0.99];
  displays = [
    [25.0, 75.0],
    [75.0, 75.0],
    [25.0, 25.0],
    [75.0, 25.0],
  ];
  localDisplays = [
    [25.0, 24.0],
    [75.0, 24.0],
    [25.0, 74.0],
    [75.0, 74.0],
  ];
  viewPort = [25.0, 25.0];
  for (let i = 0; i < renderers.length; i++) {
    testGetters(
      coord,
      renderers[i],
      testVal,
      world,
      displays[i],
      localDisplays[i],
      viewPort
    );
  }

  coord.setCoordinateSystemToNormalizedViewport();
  testVal = [0.5, 0.5, 0.0];
  world = [0.0, 0.0, 0.99];
  displays = [
    [25.0, 75.0],
    [75.0, 75.0],
    [25.0, 25.0],
    [75.0, 25.0],
  ];
  localDisplays = [
    [25.0, 24.0],
    [75.0, 24.0],
    [25.0, 74.0],
    [75.0, 74.0],
  ];
  viewPort = [25.0, 25.0];
  for (let i = 0; i < renderers.length; i++) {
    testGetters(
      coord,
      renderers[i],
      testVal,
      world,
      displays[i],
      localDisplays[i],
      viewPort
    );
  }

  coord.setCoordinateSystemToView();
  testVal = [0.0, 0.0, 0.0];
  world = [0.0, 0.0, 1.0];
  displays = [
    [25.0, 75.0],
    [75.0, 75.0],
    [25.0, 25.0],
    [75.0, 25.0],
  ];
  localDisplays = [
    [25.0, 24.0],
    [75.0, 24.0],
    [25.0, 74.0],
    [75.0, 74.0],
  ];
  viewPort = [25.0, 25.0];
  for (let i = 0; i < renderers.length; i++) {
    testGetters(
      coord,
      renderers[i],
      testVal,
      world,
      displays[i],
      localDisplays[i],
      viewPort
    );
  }

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
  world = [0.0, 0.0, 1.0];
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

  gc.releaseResources();
});
