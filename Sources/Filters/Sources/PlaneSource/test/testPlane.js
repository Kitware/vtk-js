import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './testPlane.png';

test.onlyIfWebGL('Test vtkPlaneSource Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkPlaneSource Rendering');

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

  const light1 = gc.registerResource(vtkLight.newInstance());
  light1.setColor(1, 0, 1);
  light1.setFocalPoint(0.5, 0.5, 0);
  light1.setPosition(0.5, -0.5, 1);
  light1.setPositional(true);
  light1.setConeAngle(15);
  light1.setExponent(20);

  const light2 = gc.registerResource(vtkLight.newInstance());
  light2.setColor(1, 1, 0);
  light2.setPosition(0, 1, 1);
  renderer.addLight(light1);
  renderer.addLight(light2);

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const PlaneSource = gc.registerResource(
    vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 })
  );
  mapper.setInputConnection(PlaneSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Filters/Sources/PlaneSource/testPlane',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
