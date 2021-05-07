import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';
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

function createCirclePipeline() {
  const cylinderSource = vtkCircleSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  cylinderSource.setLines(true);
  cylinderSource.setFace(true);

  actor.setMapper(mapper);
  mapper.setInputConnection(cylinderSource.getOutputPort());

  renderer.addActor(actor);
  return { cylinderSource, mapper, actor };
}

const pipelines = [createCirclePipeline()];
pipelines[0].actor.getProperty().setColor(1, 0, 0);

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['radius', 'resolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    pipelines[0].cylinderSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

['lines', 'face'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    pipelines[0].cylinderSource.set({ [propertyName]: e.target.checked });
    renderWindow.render();
  });
});

const centerElems = document.querySelectorAll('.center');

function updateTransformedCircle() {
  const center = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    center[Number(centerElems[i].dataset.index)] = Number(centerElems[i].value);
  }
  pipelines[0].cylinderSource.set({ center });
  renderWindow.render();
}

for (let i = 0; i < 3; i++) {
  centerElems[i].addEventListener('input', updateTransformedCircle);
}

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
