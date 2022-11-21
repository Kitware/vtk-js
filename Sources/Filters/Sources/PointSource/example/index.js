import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkPointSource from '@kitware/vtk.js/Filters/Sources/PointSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import * as vtkMath from '@kitware/vtk.js/Common/Core/Math';

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

vtkMath.randomSeed(141592);

const pointSource = vtkPointSource.newInstance({
  numberOfPoints: 25,
  radius: 0.25,
});
// pointSource.setNumberOfPoints(25);
// pointSource.setRadius(0.25);

const mapper = vtkMapper.newInstance();

const actor = vtkActor.newInstance();
actor.getProperty().setEdgeVisibility(true);
actor.getProperty().setPointSize(5);

mapper.setInputConnection(pointSource.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['numberOfPoints', 'radius'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    pointSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

// ----- Console play ground -----
global.pointSource = pointSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
