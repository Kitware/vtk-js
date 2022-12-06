import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { Representation } from '@kitware/vtk.js/Rendering/Core/Property/Constants';

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

fullScreenRenderer.addController(controlPanel);

['resolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    lineSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});
const mapping = 'xyz';
const points = [
  [0, 0, 0],
  [0, 0, 0],
];
['x1', 'y1', 'z1', 'x2', 'y2', 'z2'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    const pointIdx = Number(propertyName[1]);
    points[pointIdx - 1][mapping.indexOf(propertyName[0])] = value;
    lineSource.set({ [`point${pointIdx}`]: points[pointIdx - 1] });
    renderWindow.render();
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.lineSource = lineSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
