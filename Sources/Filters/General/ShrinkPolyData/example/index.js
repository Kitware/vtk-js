import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkShrinkPolyData from '@kitware/vtk.js/Filters/General/ShrinkPolyData';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const shrinkPolyData = vtkShrinkPolyData.newInstance();
shrinkPolyData.setShrinkFactor(0.25);

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
mapper.setInputConnection(shrinkPolyData.getOutputPort());
actor.setMapper(mapper);

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
shrinkPolyData.setInputConnection(reader.getOutputPort());

reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`).then(() => {
  reader.loadData().then(() => {
    renderer.addActor(actor);
    renderer.resetCamera();
    renderWindow.render();
  });
});

['shrinkFactor'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    shrinkPolyData.set({ [propertyName]: value });
    renderWindow.render();
  });
});
