import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkTextActor from '@kitware/vtk.js/Rendering/Core/TextActor';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const actor = vtkTextActor.newInstance();
actor.setInput('Hello World!');
actor.setDisplayPosition(20, 30);

renderer.addActor2D(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

const textInput = document.getElementById('text');
textInput.addEventListener('input', (event) => {
  const value = event.target.value;
  actor.setInput(value);
  renderWindow.render();
});
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
