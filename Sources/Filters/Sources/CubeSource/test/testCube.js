import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import baseline1 from './testCube.png';
import baseline2 from './testCube_2.png';

test.onlyIfWebGL('Test vtkCubeSource Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkCubeSource Rendering');

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

  const cube0 = gc.registerResource(vtkCubeSource.newInstance());
  const mapperCube0 = gc.registerResource(vtkMapper.newInstance());
  mapperCube0.setInputConnection(cube0.getOutputPort());
  const actorCube0 = gc.registerResource(vtkActor.newInstance());
  actorCube0.setMapper(mapperCube0);
  renderer.addActor(actorCube0);

  const cube1 = gc.registerResource(
    vtkCubeSource.newInstance({
      xLength: 2.0,
      yLength: 2.0,
      zLength: 2.0,
      center: [3.0, 0.0, 0.0],
    })
  );
  const mapperCube1 = gc.registerResource(vtkMapper.newInstance());
  mapperCube1.setInputConnection(cube1.getOutputPort());
  const actorCube1 = gc.registerResource(vtkActor.newInstance());
  actorCube1.setMapper(mapperCube1);
  renderer.addActor(actorCube1);

  const cube2 = gc.registerResource(vtkCubeSource.newInstance());
  cube2.setBounds(-5.0, -2.0, 1, 6, 2, 9);
  cube2.setCenter([9.0, 0.0, 0.0]);
  const mapperCube2 = gc.registerResource(vtkMapper.newInstance());
  mapperCube2.setInputConnection(cube2.getOutputPort());
  const actorCube2 = gc.registerResource(vtkActor.newInstance());
  actorCube2.setMapper(mapperCube2);
  renderer.addActor(actorCube2);

  const cube3 = gc.registerResource(vtkCubeSource.newInstance());
  cube3.setBounds([-5.0, -2.0, 1, 6, 2, 9]);
  cube3.setCenter([15.0, 0.0, 0.0]);
  const mapperCube3 = gc.registerResource(vtkMapper.newInstance());
  mapperCube3.setInputConnection(cube3.getOutputPort());
  const actorCube3 = gc.registerResource(vtkActor.newInstance());
  actorCube3.setMapper(mapperCube3);
  renderer.addActor(actorCube3);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline1, baseline2],
      'Filters/Sources/CubeSource/testCube',
      t,
      2.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
