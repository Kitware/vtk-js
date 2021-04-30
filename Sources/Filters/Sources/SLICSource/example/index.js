import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSLICSource from 'vtk.js/Sources/Filters/Sources/SLICSource';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

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
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const NB_CLUSTERS = 20;
const GRID_SIZE = [256, 256, 10];

const source = vtkSLICSource.newInstance({ dimensions: GRID_SIZE });

for (let i = 0; i < NB_CLUSTERS; i++) {
  const x = Math.random() * GRID_SIZE[0];
  const y = Math.random() * GRID_SIZE[1];
  const z = Math.random() * GRID_SIZE[2];
  const fnConst = Math.random() * NB_CLUSTERS;
  const sx = Math.random() * 2 - 1;
  const sy = Math.random() * 2 - 1;
  const sz = Math.random() * 2 - 1;
  source.addCluster(x, y, z, fnConst, sx, sy, sz);
}

const colorBy = source.getScalarArrayName(); // cluster field
const dataRange = [-NB_CLUSTERS, NB_CLUSTERS];

const imageData = source.getOutputData();
imageData.getPointData().setScalars(imageData.getPointData().getArray(colorBy));

console.log(imageData);

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(dataRange[0], 1, 0, 0);
ctfun.addRGBPoint((dataRange[0] + dataRange[1]) * 0.5, 0, 0, 0.2);
ctfun.addRGBPoint(dataRange[1], 0, 1.0, 1);

const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(dataRange[0], 0);
ofun.addPoint((dataRange[0] + dataRange[1]) * 0.5, 1);
ofun.addPoint(dataRange[1], 0);

actor.getProperty().setRGBTransferFunction(0, ctfun);
// actor.getProperty().setScalarOpacity(0, ofun);

actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

mapper.setInputData(imageData);

renderer.addVolume(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = source;
global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.renderer = renderer;
global.renderWindow = renderWindow;
