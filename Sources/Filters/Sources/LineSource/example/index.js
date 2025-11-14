import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { Representation } from '@kitware/vtk.js/Rendering/Core/Property/Constants';

import GUI from 'lil-gui';

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

const lineSource = vtkLineSource.newInstance();
const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();

actor.getProperty().setPointSize(10);
actor.getProperty().setRepresentation(Representation.POINTS);

actor.setMapper(mapper);
mapper.setInputConnection(lineSource.getOutputPort());

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  resolution: 10,
  x1: -1,
  y1: 0,
  z1: 0,
  x2: 1,
  y2: 0,
  z2: 0,
};

function updateLine() {
  lineSource.set({
    resolution: Number(params.resolution),
    point1: [params.x1, params.y1, params.z1],
    point2: [params.x2, params.y2, params.z2],
  });
  renderWindow.render();
}

gui
  .add(params, 'resolution')
  .name('Resolution')
  .onChange((value) => {
    params.resolution = Number(value);
    updateLine();
  });

gui.add(params, 'x1').name('Point 1 X').onChange(updateLine);
gui.add(params, 'y1').name('Point 1 Y').onChange(updateLine);
gui.add(params, 'z1').name('Point 1 Z').onChange(updateLine);

gui.add(params, 'x2').name('Point 2 X').onChange(updateLine);
gui.add(params, 'y2').name('Point 2 Y').onChange(updateLine);
gui.add(params, 'z2').name('Point 2 Z').onChange(updateLine);

updateLine();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.lineSource = lineSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
