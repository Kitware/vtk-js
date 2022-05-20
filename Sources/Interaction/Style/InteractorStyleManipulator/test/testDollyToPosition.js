import test from 'tape-catch';
import { vec3 } from 'gl-matrix';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';

function setup(t) {
  // set up environment
  const gc = testUtils.createGarbageCollector(t);
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);

  const view = gc.registerResource(renderWindow.newAPISpecificView());
  view.setContainer(renderWindowContainer);
  renderWindow.addView(view);
  view.setSize(400, 400);

  const interactor = gc.registerResource(
    vtkRenderWindowInteractor.newInstance()
  );
  interactor.setView(view);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  const style = vtkInteractorStyleManipulator.newInstance();
  interactor.setInteractorStyle(style);

  return { gc, renderWindow, renderer, view, interactor, style };
}

test.onlyIfWebGL('Test dollyToPosition with 2D renderers', (t) => {
  const { gc, renderer, renderWindow, interactor } = setup(t);
  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(true);
  let baseline = [];

  function resetCamera() {
    camera.setPosition(0, 0, 0);
    camera.setDirectionOfProjection(0, 0, 1);
    camera.setViewUp(0, 1, 0);
    camera.setFocalPoint(0, 0, 2);
    renderer.resetCamera([0, 1, 0, 1, 0, 1]);
  }

  resetCamera();
  renderWindow.render();

  baseline = camera.getPosition();
  vtkInteractorStyleManipulator.dollyToPosition(
    1,
    { x: 10, y: 20 },
    renderer,
    interactor
  );
  t.deepEquals(
    camera.getPosition(),
    baseline,
    'Factor=1 does not change position'
  );

  resetCamera();
  renderer.setViewport(0, 0, 0.5, 0.5);
  renderWindow.render();

  vtkInteractorStyleManipulator.dollyToPosition(
    0.5,
    { x: 10, y: 10 },
    renderer,
    interactor
  );
  baseline = camera.getPosition();

  resetCamera();
  renderer.setViewport(0.5, 0, 1, 0.5);
  renderWindow.render();

  vtkInteractorStyleManipulator.dollyToPosition(
    0.5,
    // adjust mouse position to be in the same spot on the renderer
    // as before.
    { x: 210, y: 10 },
    renderer,
    interactor
  );

  t.ok(
    vec3.equals(camera.getPosition(), baseline),
    'Factor=0.5, right positioned renderer'
  );

  gc.releaseResources();
});
