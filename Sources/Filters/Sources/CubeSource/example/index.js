import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
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

function createCubePipeline() {
  const cubeSource = vtkCubeSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputConnection(cubeSource.getOutputPort());

  renderer.addActor(actor);
  return { cubeSource, mapper, actor };
}

const pipelines = [createCubePipeline(), createCubePipeline()];

// Create red wireframe baseline
pipelines[0].actor.getProperty().setRepresentation(1);
pipelines[0].actor.getProperty().setColor(1, 0, 0);

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['xLength', 'yLength', 'zLength'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    pipelines[0].cubeSource.set({ [propertyName]: value });
    pipelines[1].cubeSource.set({ [propertyName]: value });
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

const centerElems = document.querySelectorAll('.center');
const rotationsElems = document.querySelectorAll('.rotations');

function updateTransformedCube() {
  const center = [0, 0, 0];
  const rotations = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    center[Number(centerElems[i].dataset.index)] = Number(centerElems[i].value);
    rotations[Number(rotationsElems[i].dataset.index)] = Number(
      rotationsElems[i].value
    );
  }
  pipelines[1].cubeSource.set({ center, rotations });
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

for (let i = 0; i < 3; i++) {
  centerElems[i].addEventListener('input', updateTransformedCube);
  rotationsElems[i].addEventListener('input', updateTransformedCube);
}

const lengthElems = document.querySelectorAll('.length');

function resetUI() {
  const length = [1, 1, 1];
  const center = [0, 0, 0];
  const rotations = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    centerElems[i].value = Number(center[i]);
    rotationsElems[i].value = Number(rotations[i]);
    lengthElems[i].value = Number(length[i]);
  }

  for (let i = 0; i < 2; i++) {
    pipelines[i].cubeSource.set({ xLength: Number(length[0]) });
    pipelines[i].cubeSource.set({ yLength: Number(length[1]) });
    pipelines[i].cubeSource.set({ zLength: Number(length[2]) });
  }
  pipelines[1].cubeSource.set({ center, rotations });

  renderer.resetCamera();
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

const resetButton = document.querySelector('.reset');
resetButton.addEventListener('click', resetUI);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
