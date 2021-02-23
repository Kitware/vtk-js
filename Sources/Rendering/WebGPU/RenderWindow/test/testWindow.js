import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkWebGPURenderWindow from 'vtk.js/Sources/Rendering/WebGPU/RenderWindow';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
// import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

import baseline from './testWindow.png';

test.onlyIfWebGL('Test Window', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkWebGPURenderWindow testWindow');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderer.setBackground(0.2, 0.3, 0.4, 1.0);
  renderWindow.addRenderer(renderer);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  // const planeSource = gc.registerResource(vtkPlaneSource.newInstance());
  const planeSource = gc.registerResource(vtkConeSource.newInstance());
  planeSource.setResolution(24);
  const mapper = gc.registerResource(vtkMapper.newInstance());
  const actor = gc.registerResource(vtkActor.newInstance());
  actor.getProperty().setAmbientColor(0.4, 1.0, 0.8);
  actor.getProperty().setAmbient(0.3);
  actor.getProperty().setDiffuseColor(1.0, 0.8, 0.4);
  actor.getProperty().setDiffuse(0.7);
  actor.getProperty().setSpecular(0.3);
  actor.getProperty().setSpecularPower(15.0);

  mapper.setInputConnection(planeSource.getOutputPort());
  actor.setMapper(mapper);

  renderer.addActor(actor);
  renderer.resetCamera();
  renderWindow.render();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it, in this case webgl
  const gpuwindow = gc.registerResource(vtkWebGPURenderWindow.newInstance());
  gpuwindow.setContainer(renderWindowContainer);
  renderWindow.addView(gpuwindow);
  gpuwindow.setSize(400, 400);

  const iren = gc.registerResource(vtkRenderWindowInteractor.newInstance());
  iren.setView(gpuwindow);
  iren.initialize();
  iren.bindEvents(renderWindowContainer);

  // ----------------------------------------------------------------------------
  // Setup interactor style to use
  // ----------------------------------------------------------------------------

  iren.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  // iren.requestAnimation(gpuwindow);

  // gpuwindow.captureNextImage().then((image) => {
  //   iren.cancelAnimation(gpuwindow);
  //   testUtils.compareImages(
  //     image,
  //     [baseline],
  //     'Rendering/WebGPU/RenderWindow',
  //     t,
  //     1,
  //     gc.releaseResources
  //   );
  // });
});
