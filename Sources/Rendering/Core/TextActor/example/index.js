import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkTextActor from '@kitware/vtk.js/Rendering/Core/TextActor';

import GUI from 'lil-gui';

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
actor.setDisplayPosition(window.innerWidth / 4, window.innerHeight / 4);

renderer.addActor2D(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  text: 'Hello World!',
  x: window.innerWidth / 4,
  y: window.innerHeight / 4,
};

gui
  .add(params, 'text')
  .name('Text')
  .onChange((value) => {
    actor.setInput(value);
    renderWindow.render();
  });
gui
  .add(params, 'x')
  .name('X Position')
  .onChange((value) => {
    actor.setDisplayPosition(value, params.y);
    renderWindow.render();
  });
gui
  .add(params, 'y')
  .name('Y Position')
  .onChange((value) => {
    actor.setDisplayPosition(params.x, value);
    renderWindow.render();
  });

global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
