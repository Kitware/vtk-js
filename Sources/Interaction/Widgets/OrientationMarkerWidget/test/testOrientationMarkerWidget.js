import { it, expect } from 'vitest';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';

function createWindow(gc) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  gc.push(() => container.remove());

  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  const view = renderWindow.newAPISpecificView();
  view.setContainer(container);
  view.setSize(100, 100);
  renderWindow.addView(view);
  gc.push(() => view.delete());
  return { renderWindow, renderer, view };
}

it('setEnabled(false) removes the marker renderer from its own window', () => {
  const gc = [];
  const main = createWindow(gc);
  const other = createWindow(gc);

  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setView(main.view);
  interactor.initialize();

  const widget = vtkOrientationMarkerWidget.newInstance({
    actor: vtkAxesActor.newInstance(),
    interactor,
    parentRenderer: other.renderer,
  });

  widget.setEnabled(true);
  expect(other.renderWindow.getRenderers().length).toBe(2);
  expect(main.renderWindow.getRenderers().length).toBe(1);

  widget.setEnabled(false);
  expect(other.renderWindow.getRenderers().length).toBe(1);
  expect(main.renderWindow.getRenderers().length).toBe(1);

  widget.delete();
  interactor.delete();
  gc.reverse().forEach((fn) => fn());
});
