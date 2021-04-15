import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkConcentricCylinderSource from 'vtk.js/Sources/Filters/Sources/ConcentricCylinderSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './testConcentricCylinder.png';

test.onlyIfWebGL('Test vtkConcentricCylinderSource Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkConcentricCylinderSource Rendering');

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
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const concentricCylinderSource = gc.registerResource(
    vtkConcentricCylinderSource.newInstance({
      height: 1.0,
      radius: [0.2, 0.6, 1],
      cellFields: [0, 0.6, 1],
    })
  );
  concentricCylinderSource.setResolution(40);
  concentricCylinderSource.setMaskLayer(0, true);
  mapper.setInputConnection(concentricCylinderSource.getOutputPort());

  const lut = mapper.getLookupTable();
  lut.setValueRange(0.2, 1);
  lut.setHueRange(0.666, 0);

  const activeCamera = renderer.getActiveCamera();
  activeCamera.setPosition(0, -5, 5);
  activeCamera.setFocalPoint(0, 0, 0);
  activeCamera.setViewUp(0, 1, 0);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Filters/Sources/ConcentricCylinderSource/testConcenticCylinder',
      t,
      2.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
