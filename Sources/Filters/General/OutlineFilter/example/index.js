import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPointSource from 'vtk.js/Sources/Filters/Sources/PointSource';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
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

function addRepresentation(name, filter, props = {}) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(filter.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().set(props);
  renderer.addActor(actor);

  global[`${name}Actor`] = actor;
  global[`${name}Mapper`] = mapper;
}

// ----------------------------------------------------------------------------

vtkMath.randomSeed(141592);

const pointSource = vtkPointSource.newInstance({
  numberOfPoints: 25,
  radius: 0.25,
});
const outline = vtkOutlineFilter.newInstance();

outline.setInputConnection(pointSource.getOutputPort());

addRepresentation('pointSource', pointSource, { pointSize: 5 });
addRepresentation('outline', outline, { lineWidth: 5 });

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
global.outline = outline;
global.renderer = renderer;
global.renderWindow = renderWindow;
