import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import * as d3scale from 'd3-scale';
import * as d3array from 'd3-array';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCubeAxesActor from '@kitware/vtk.js/Rendering/Core/CubeAxesActor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.3, 0.4],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Simple pipeline ConeSource --> Mapper --> Actor
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

// ----------------------------------------------------------------------------
// Add the actor to the renderer and set the camera based on it
// ----------------------------------------------------------------------------

renderer.addActor(actor);

const cubeAxes = vtkCubeAxesActor.newInstance();
cubeAxes.setCamera(renderer.getActiveCamera());
cubeAxes.setDataBounds(actor.getBounds());
// Replace ticks from axis 0
function myGenerateTicks(dataBounds) {
  const res = vtkCubeAxesActor.defaultGenerateTicks(dataBounds);
  const scale = d3scale.scaleLinear().domain([dataBounds[0], dataBounds[1]]);
  res.ticks[0] = d3array.range(dataBounds[0], dataBounds[1], 0.1);
  const format = scale.tickFormat(res.ticks[0].length);
  res.tickStrings[0] = res.ticks[0].map(format);
  return res;
}
cubeAxes.setGenerateTicks(myGenerateTicks);
renderer.addActor(cubeAxes);

renderer.resetCamera();
renderWindow.render();

// make the cubeAxes global visibility in case you want to try changing
// some values
global.cubeAxes = cubeAxes;
