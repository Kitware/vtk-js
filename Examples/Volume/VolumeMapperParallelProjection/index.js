import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
// import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
// import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.3],
});

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

// SETUP ================
// Load script from https://unpkg.com/vtk.js then...

const cubeSource = vtkCubeSource.newInstance();

cubeSource.setXLength(100);
cubeSource.setYLength(100);
cubeSource.setZLength(1);

console.log(cubeSource);

const cubeActor = vtkActor.newInstance();
const cubeMapper = vtkMapper.newInstance();

cubeActor.setMapper(cubeMapper);
cubeMapper.setInputConnection(cubeSource.getOutputPort());

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance({
  sampleDistance: 1.1,
});

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

renderer.addActor(cubeActor);

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl('https://kitware.github.io/vtk-js/data/volume/LIDC2.vti')
  .then(() => {
    reader.loadData().then(() => {
      const imageData = reader.getOutputData();
      const dataArray = imageData.getPointData().getScalars();

      const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0);
      rgbTransferFunction.setRange(...dataArray.getRange());

      renderer.addVolume(actor);
      renderer.resetCamera();
      renderWindow.render();
    });
  });

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

mapper.setBlendModeToMaximumIntensity();

renderer.getActiveCamera().setViewUp(0, 1, 0);

// TEST PARALLEL ==============

let isParallel = false;
const button = document.querySelector('.text');

function toggleParallel() {
  isParallel = !isParallel;
  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(isParallel);

  renderer.resetCamera();

  button.innerText = `(${isParallel ? 'on' : 'off'})`;

  renderWindow.render();
}

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.toggleParallel = toggleParallel;
