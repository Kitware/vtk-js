import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline from './testClippingPlanes.png';

test.onlyIfWebGL('Test Clipping planes', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLPolyDataMapper setClippingPlanes');

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
  renderer.setBackground(0.0, 0.0, 0.0);
  renderer.getActiveCamera().setPosition(-0.2663, -4.6674, 4.2028);
  renderer.getActiveCamera().setFocalPoint(1, 0, 0);
  renderer.getActiveCamera().setViewUp(0.2114288, 0.5581, 0.80233);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------
  const cube0 = gc.registerResource(vtkCubeSource.newInstance());

  const mapperCube0 = gc.registerResource(vtkMapper.newInstance());
  mapperCube0.setInputConnection(cube0.getOutputPort());
  const actorCube0 = gc.registerResource(vtkActor.newInstance());
  actorCube0.setMapper(mapperCube0);
  renderer.addActor(actorCube0);

  const planeX = gc.registerResource(
    vtkPlane.newInstance({
      origin: [2.0, 0.0, 0.0],
      normal: [1.0, 0.0, 0.0],
    })
  );

  const planeY = gc.registerResource(
    vtkPlane.newInstance({
      origin: [2.0, 0.0, 0.0],
      normal: [0.0, 1.0, 0.0],
    })
  );

  const planeZ = gc.registerResource(
    vtkPlane.newInstance({
      origin: [2.0, 0.0, 0.0],
      normal: [0.0, 0.0, 1.0],
    })
  );

  const cube1 = gc.registerResource(
    vtkCubeSource.newInstance({
      center: [2.0, 0.0, 0.0],
    })
  );
  const mapperCube1 = gc.registerResource(vtkMapper.newInstance());
  mapperCube1.setInputConnection(cube1.getOutputPort());
  mapperCube1.addClippingPlane(planeX);
  mapperCube1.addClippingPlane(planeY);
  mapperCube1.addClippingPlane(planeZ);
  const actorCube1 = gc.registerResource(vtkActor.newInstance());
  actorCube1.setMapper(mapperCube1);
  renderer.addActor(actorCube1);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'TestClippingPlanes',
      t,
      2.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
