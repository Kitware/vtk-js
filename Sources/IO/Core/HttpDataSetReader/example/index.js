import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`).then(() => {
  reader.loadData().then(() => {
    renderer.resetCamera();
    renderWindow.render();
  });
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(reader.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
