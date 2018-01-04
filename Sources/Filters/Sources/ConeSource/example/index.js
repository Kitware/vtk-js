import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

function createConePipeline() {
  const coneSource = vtkConeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(coneSource.getOutputPort());

  renderer.addActor(actor);
  return { coneSource, mapper, actor };
}

const pipelines = [createConePipeline(), createConePipeline()];

// Create red wireframe baseline
pipelines[0].actor.getProperty().setRepresentation(1);
pipelines[0].actor.getProperty().setColor(1, 0, 0);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['height', 'radius', 'resolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    pipelines[0].coneSource.set({ [propertyName]: value });
    pipelines[1].coneSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

document.querySelector('.capping').addEventListener('change', (e) => {
  const capping = !!e.target.checked;
  pipelines[0].coneSource.set({ capping });
  pipelines[1].coneSource.set({ capping });
  renderWindow.render();
});

const centerElems = document.querySelectorAll('.center');
const directionElems = document.querySelectorAll('.direction');

function updateTransformedCone() {
  const center = [0, 0, 0];
  const direction = [1, 0, 0];
  for (let i = 0; i < 3; i++) {
    center[Number(centerElems[i].dataset.index)] = Number(centerElems[i].value);
    direction[Number(directionElems[i].dataset.index)] = Number(
      directionElems[i].value
    );
  }
  console.log('updateTransformedCone', center, direction);
  pipelines[1].coneSource.set({ center, direction });
  renderWindow.render();
}

for (let i = 0; i < 3; i++) {
  centerElems[i].addEventListener('input', updateTransformedCone);
  directionElems[i].addEventListener('input', updateTransformedCone);
}

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
