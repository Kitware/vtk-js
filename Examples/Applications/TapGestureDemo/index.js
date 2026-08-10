import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const interactor = renderWindow.getInteractor();

const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 16px; left: 16px; z-index: 10;
  padding: 12px 16px; border-radius: 8px;
  background: rgba(20, 20, 30, 0.85); color: #eee;
  font: 13px/1.6 monospace; white-space: pre; pointer-events: none;
`;
overlay.textContent = 'Touch here: tap or long-press';
document.body.appendChild(overlay);

function showGesture(name, e) {
  const pos = e?.position
    ? ` (${e.position.x.toFixed(0)}, ${e.position.y.toFixed(0)})`
    : '';
  overlay.textContent = `${name}${pos}  @ ${new Date().toLocaleTimeString()}`;
  overlay.style.outline = '2px solid #4caf50';
  setTimeout(() => {
    overlay.style.outline = 'none';
  }, 500);
}

const subscriptions = [
  interactor.onTap((e) => showGesture('Tap', e)),
  interactor.onLongTap((e) => showGesture('LongTap', e)),
];

// Example code

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// Cleanup

fullScreenRenderer.setResizeCallback(() => {
  renderer.resetCamera();
  renderWindow.render();
});

window.addEventListener('beforeunload', () => {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
});
