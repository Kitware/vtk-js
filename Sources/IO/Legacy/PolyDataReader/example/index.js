import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';

const fileName = 'sphere.vtk'; // 'uh60.vtk'; // 'luggaBody.vtk';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkPolyDataReader.newInstance();
reader.setUrl(`${__BASE_PATH__}/data/legacy/${fileName}`).then(() => {
  const polydata = reader.getOutputData(0);
  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();

  actor.setMapper(mapper);
  mapper.setInputData(polydata);

  renderer.addActor(actor);

  resetCamera();
  render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.reader = reader;
global.fullScreenRenderer = fullScreenRenderer;
