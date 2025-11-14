import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkPointSource from '@kitware/vtk.js/Filters/Sources/PointSource';
import vtkOutlineFilter from '@kitware/vtk.js/Filters/General/OutlineFilter';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import * as vtkMath from '@kitware/vtk.js/Common/Core/Math';

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

const gui = new GUI();
const params = {
  numberOfPoints: 25,
  radius: 0.25,
};

gui
  .add(params, 'numberOfPoints', 1, 500, 1)
  .name('Number of points')
  .onChange((value) => {
    pointSource.set({ numberOfPoints: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'radius', 0.1, 0.5, 0.01)
  .name('Radius')
  .onChange((value) => {
    pointSource.set({ radius: Number(value) });
    renderWindow.render();
  });

// ----- Console play ground -----
global.pointSource = pointSource;
global.outline = outline;
global.renderer = renderer;
global.renderWindow = renderWindow;
