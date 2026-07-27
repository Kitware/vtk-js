import { it, expect } from 'vitest';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

function setup() {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0.2, 0.3, 0.4],
  });
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const renderer = fullScreenRenderer.getRenderer();
  renderWindow.addRenderer(renderer);
  const interactor = fullScreenRenderer.getInteractor();
  const trackballCamera = vtkInteractorStyleTrackballCamera.newInstance();
  interactor.setInteractorStyle(trackballCamera);
  const interactorStyle = interactor.getInteractorStyle();
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

it('Test vtkInteractorStyleTrackballCamera mouse wheel event symetry', () => {
  const { renderer, interactorStyle } = setup();
  renderer.resetCamera();
  const camera = renderer.getActiveCamera();
  const sequences = [
    [-1, 1],
    [0.5, -0.5],
    [0.2, 0.3, -0.3, -0.2],
    [-2, 3, 2, -3],
  ];
  for (const sequence of sequences) {
    const position = camera.getPosition();
    for (const diff of sequence) {
      interactorStyle.handleMouseWheel({
        spinY: diff,
        pokedRenderer: renderer,
      });
    }
    expect(
      camera.getPosition(),
      'Make sure chaining 2 mouse wheel events of opposite values is equivalent to a no-op.'
    ).toEqual(position);
  }
});
