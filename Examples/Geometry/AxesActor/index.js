import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import macro from '@kitware/vtk.js/macros';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import controlPanel from './controlPanel.html';

console.warn(
  'Click on index.ts to open source code for this example --------->'
);

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.3, 0.4],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const axesActor = vtkAxesActor.newInstance();
renderer.addActor(axesActor);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

function updateRendering() {
  axesActor.update();
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

document.querySelector('.recenter').addEventListener('change', (e) => {
  const config = axesActor.getConfig();
  config.recenter = !!e.target.checked;
  axesActor.setConfig(config);
  updateRendering();
});

document.querySelector('.xAxisInvert').addEventListener('change', (e) => {
  const config = axesActor.getXConfig();
  config.invert = !!e.target.checked;
  axesActor.setXConfig(config);
  updateRendering();
});

document.querySelector('.yAxisInvert').addEventListener('change', (e) => {
  const config = axesActor.getYConfig();
  config.invert = !!e.target.checked;
  axesActor.setYConfig(config);
  updateRendering();
});

document.querySelector('.zAxisInvert').addEventListener('change', (e) => {
  const config = axesActor.getZConfig();
  config.invert = !!e.target.checked;
  axesActor.setZConfig(config);
  updateRendering();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.setLoggerFunction = macro.setLoggerFunction;
global.axesActor = axesActor;
global.renderer = renderer;
global.renderWindow = renderWindow;
