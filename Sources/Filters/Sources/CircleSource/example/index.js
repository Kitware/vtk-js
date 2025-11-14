import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCircleSource from '@kitware/vtk.js/Filters/Sources/CircleSource';
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

const gui = new GUI();
const params = {
  radius: 1.0,
  resolution: 6,
  lines: true,
  face: true,
  centerX: 0,
  centerY: 0,
  centerZ: 0,
};

function updateCircle() {
  pipelines[0].cylinderSource.set({
    radius: params.radius,
    resolution: params.resolution,
    lines: params.lines,
    face: params.face,
    center: [params.centerX, params.centerY, params.centerZ],
  });
  renderWindow.render();
}

gui
  .add(params, 'radius', 0.5, 2.0, 0.1)
  .name('Radius')
  .onChange((value) => {
    params.radius = Number(value);
    updateCircle();
  });

gui
  .add(params, 'resolution', 4, 100, 1)
  .name('Resolution')
  .onChange((value) => {
    params.resolution = Number(value);
    updateCircle();
  });

gui
  .add(params, 'lines')
  .name('Show edges')
  .onChange((value) => {
    params.lines = !!value;
    updateCircle();
  });

gui
  .add(params, 'face')
  .name('Show face')
  .onChange((value) => {
    params.face = !!value;
    updateCircle();
  });

gui
  .add(params, 'centerX', -1.0, 1.0, 0.1)
  .name('Center X')
  .onChange(updateCircle);
gui
  .add(params, 'centerY', -1.0, 1.0, 0.1)
  .name('Center Y')
  .onChange(updateCircle);
gui
  .add(params, 'centerZ', -1.0, 1.0, 0.1)
  .name('Center Z')
  .onChange(updateCircle);

updateCircle();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.pipelines = pipelines;
global.renderer = renderer;
global.renderWindow = renderWindow;
