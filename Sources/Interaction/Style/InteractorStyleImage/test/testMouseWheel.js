import { it, expect } from 'vitest';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';

function setup() {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0.2, 0.3, 0.4],
  });
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const renderer = fullScreenRenderer.getRenderer();
  renderWindow.addRenderer(renderer);
  const interactor = fullScreenRenderer.getInteractor();
  const interactorStyle = vtkInteractorStyleImage.newInstance();
  interactor.setInteractorStyle(interactorStyle);
  const coneSource = vtkConeSource.newInstance({ height: 1.0 });
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(coneSource.getOutputPort());
  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  renderer.addActor(actor);
  renderer.resetCamera();
  renderWindow.render();
  return { renderer, interactorStyle };
}

it('Test vtkInteractorStyleImage mouse move during mouse wheel does not slice', () => {
  const { renderer, interactorStyle } = setup();
  const camera = renderer.getActiveCamera();

  const distance = camera.getDistance();
  const focalPoint = [...camera.getFocalPoint()];
  interactorStyle.handleStartMouseWheel();
  interactorStyle.handleMouseMove({
    position: { x: 10, y: 50 },
    pokedRenderer: renderer,
  });
  interactorStyle.handleEndMouseWheel();

  expect(
    camera.getDistance(),
    'Make sure moving the mouse while the mouse wheel is handled leaves the camera unchanged.'
  ).toEqual(distance);
  expect(camera.getFocalPoint()).toEqual(focalPoint);
});
