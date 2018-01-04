import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPointSource from 'vtk.js/Sources/Filters/Sources/PointSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

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
