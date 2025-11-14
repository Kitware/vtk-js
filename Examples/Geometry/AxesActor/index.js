import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import macro from '@kitware/vtk.js/macros';
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import GUI from 'lil-gui';

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

const gui = new GUI();
const params = {
  recenter: true,
  xAxisInvert: false,
  yAxisInvert: false,
  zAxisInvert: false,
};

function updateRendering() {
  axesActor.update();
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

gui
  .add(params, 'recenter')
  .name('Center axis')
  .onChange((value) => {
    const config = axesActor.getConfig();
    config.recenter = !!value;
    axesActor.setConfig(config);
    updateRendering();
  });

gui
  .add(params, 'xAxisInvert')
  .name('X axis inversion')
  .onChange((value) => {
    const config = axesActor.getXConfig();
    config.invert = !!value;
    axesActor.setXConfig(config);
    updateRendering();
  });

gui
  .add(params, 'yAxisInvert')
  .name('Y axis inversion')
  .onChange((value) => {
    const config = axesActor.getYConfig();
    config.invert = !!value;
    axesActor.setYConfig(config);
    updateRendering();
  });

gui
  .add(params, 'zAxisInvert')
  .name('Z axis inversion')
  .onChange((value) => {
    const config = axesActor.getZConfig();
    config.invert = !!value;
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
