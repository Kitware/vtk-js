import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkArrowSource from '@kitware/vtk.js/Filters/Sources/ArrowSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

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

function createArrowPipeline() {
  const arrowSource = vtkArrowSource.newInstance();
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.setMapper(mapper);
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(1, 0, 0);
  actor.getProperty().setRepresentationToSurface();
  mapper.setInputConnection(arrowSource.getOutputPort());

  renderer.addActor(actor);
  return { arrowSource, mapper, actor };
}

const pipelines = [createArrowPipeline()];

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  tipResolution: 6,
  tipRadius: 0.1,
  tipLength: 0.35,
  shaftResolution: 6,
  shaftRadius: 0.03,
  invert: false,
  directionX: 1,
  directionY: 0,
  directionZ: 0,
};

function updateArrow() {
  const { arrowSource } = pipelines[0];
  arrowSource.set({
    tipResolution: params.tipResolution,
    tipRadius: params.tipRadius,
    tipLength: params.tipLength,
    shaftResolution: params.shaftResolution,
    shaftRadius: params.shaftRadius,
    invert: params.invert,
    direction: [params.directionX, params.directionY, params.directionZ],
  });
  renderer.resetCameraClippingRange();
  renderWindow.render();
}

gui
  .add(params, 'tipResolution', 4, 100, 1)
  .name('Tip resolution')
  .onChange((value) => {
    params.tipResolution = Number(value);
    updateArrow();
  });

gui
  .add(params, 'tipRadius', 0.01, 1.0, 0.01)
  .name('Tip radius')
  .onChange((value) => {
    params.tipRadius = Number(value);
    updateArrow();
  });

gui
  .add(params, 'tipLength', 0.1, 0.5, 0.05)
  .name('Tip length')
  .onChange((value) => {
    params.tipLength = Number(value);
    updateArrow();
  });

gui
  .add(params, 'shaftResolution', 4, 100, 1)
  .name('Shaft resolution')
  .onChange((value) => {
    params.shaftResolution = Number(value);
    updateArrow();
  });

gui
  .add(params, 'shaftRadius', 0.01, 1.0, 0.01)
  .name('Shaft radius')
  .onChange((value) => {
    params.shaftRadius = Number(value);
    updateArrow();
  });

gui
  .add(params, 'invert')
  .name('Invert')
  .onChange((value) => {
    params.invert = !!value;
    updateArrow();
  });

gui
  .add(params, 'directionX', -1.0, 1.0, 0.1)
  .name('Direction X')
  .onChange(updateArrow);
gui
  .add(params, 'directionY', -1.0, 1.0, 0.1)
  .name('Direction Y')
  .onChange(updateArrow);
gui
  .add(params, 'directionZ', -1.0, 1.0, 0.1)
  .name('Direction Z')
  .onChange(updateArrow);

gui
  .add(
    {
      reset: () => {
        params.tipResolution = 6;
        params.tipRadius = 0.1;
        params.tipLength = 0.35;
        params.shaftResolution = 6;
        params.shaftRadius = 0.03;
        params.invert = false;
        params.directionX = 1;
        params.directionY = 0;
        params.directionZ = 0;
        gui.controllers.forEach((c) => c.updateDisplay?.());
        renderer.resetCamera();
        updateArrow();
      },
    },
    'reset'
  )
  .name('Reset');

updateArrow();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
