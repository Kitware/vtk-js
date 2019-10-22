import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
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
// Server is not sending the .gz and whith the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

// SETUP ================
// Load script from https://unpkg.com/vtk.js then...

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance({
  sampleDistance: 1.1,
});

const lookupTable = vtkColorTransferFunction.newInstance();
lookupTable.applyColorMap(
  vtkColorMaps.getPresetByName(vtkColorMaps.rgbPresetNames[4])
);
const piecewiseFunction = vtkPiecewiseFunction.newInstance();
piecewiseFunction.addPoint(50.0, 0.0);
piecewiseFunction.addPoint(120.0, 0.2);
piecewiseFunction.addPoint(4000.0, 0.4);

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});
reader
  .setUrl('https://kitware.github.io/vtk-js/data/volume/LIDC2.vti')
  .then(() => {
    reader.loadData().then(() => {
      const imageData = reader.getOutputData();
      const dataArray = imageData.getPointData().getScalars();

      lookupTable.setMappingRange(...dataArray.getRange());
      lookupTable.updateRange();

      renderer.addVolume(actor);
      renderer.resetCamera();
      renderer.getActiveCamera().elevation(70);
      renderWindow.render();
    });
  });

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());
actor.getProperty().setRGBTransferFunction(0, lookupTable);
actor.getProperty().setScalarOpacity(0, piecewiseFunction);

// TEST PARALLEL ==============

let isParallel = false;
const button = document.querySelector('.text');

function toggleParallel() {
  isParallel = !isParallel;
  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(isParallel);

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
