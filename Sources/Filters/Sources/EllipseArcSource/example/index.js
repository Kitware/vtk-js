import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkEllipseArcSource from '@kitware/vtk.js/Filters/Sources/EllipseArcSource';
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

const arcSource = vtkEllipseArcSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

mapper.setInputConnection(arcSource.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  startAngle: 0.0,
  segmentAngle: 90.0,
  resolution: 100,
  ratio: 1.0,
  close: false,
};

function updateArc() {
  arcSource.set({
    startAngle: params.startAngle,
    segmentAngle: params.segmentAngle,
    resolution: params.resolution,
    ratio: params.ratio,
    close: params.close,
  });
  renderer.resetCamera();
  renderWindow.render();
}

gui
  .add(params, 'startAngle', 0.5, 360.0, 0.1)
  .name('Start angle')
  .onChange((value) => {
    params.startAngle = Number(value);
    updateArc();
  });

gui
  .add(params, 'segmentAngle', 0.5, 360.0, 0.1)
  .name('Segment angle')
  .onChange((value) => {
    params.segmentAngle = Number(value);
    updateArc();
  });

gui
  .add(params, 'resolution', 1, 100, 1)
  .name('Resolution')
  .onChange((value) => {
    params.resolution = Number(value);
    updateArc();
  });

gui
  .add(params, 'ratio', 0, 1, 0.1)
  .name('Ratio')
  .onChange((value) => {
    params.ratio = Number(value);
    updateArc();
  });

gui
  .add(params, 'close')
  .name('Close')
  .onChange((value) => {
    params.close = !!value;
    updateArc();
  });

updateArc();
