import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageCPRMapper from '@kitware/vtk.js/Rendering/Core/ImageCPRMapper';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkTransform from '@kitware/vtk.js/Common/Transform/Transform';
import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder';

import controlPanel from './controller.html';

const volumePath = `${__BASE_PATH__}/data/volume/LIDC2.vti`;
const centerlinePaths = [`${__BASE_PATH__}/data/volume/centerline.json`];

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const centerline = vtkPolyData.newInstance();

const actor = vtkImageSlice.newInstance();
const mapper = vtkImageCPRMapper.newInstance();
actor.setMapper(mapper);

mapper.setInputConnection(reader.getOutputPort(), 0);
mapper.setInputData(centerline, 1);
mapper.setWidth(400);

// Base orientations (mat4) coming from the JSON
let centerlineBasesArray = new Float32Array();
// Orientations rotated around the z-axis
let rotatedBasesArray = new Float32Array();

// The centerline JSON contains positions (vec3) and orientations (mat4)
function setCenterlineJson(centerlineJson) {
  // Set positions of the centerline (model coordinates)
  const centerlinePoints = Float32Array.from(centerlineJson.position);
  const nPoints = centerlinePoints.length / 3;
  centerline.getPoints().setData(centerlinePoints, 3);

  // Set polylines of the centerline
  const centerlineLines = new Uint16Array(1 + nPoints);
  centerlineLines[0] = nPoints;
  for (let i = 0; i < nPoints; ++i) {
    centerlineLines[i + 1] = i;
  }
  centerline.getLines().setData(centerlineLines);

  // Create a rotated basis data array to oriented the CPR
  centerlineBasesArray = Float32Array.from(centerlineJson.orientation);
  rotatedBasesArray = Float32Array.from(centerlineBasesArray);
  const rotatedBases = vtkDataArray.newInstance({
    name: 'Direction',
    numberOfComponents: 16,
    values: rotatedBasesArray,
  });
  centerline.getPointData().setTensors(rotatedBases);

  centerline.modified();
  renderWindow.render();
}

// Update the angle between centerlineBasesArray and rotatedBasesArray
function setCenterlineAngle(centerlineAngle) {
  const matrix = vtkMatrixBuilder
    .buildFromDegree()
    .rotateZ(centerlineAngle)
    .getMatrix();
  const zRotation = vtkTransform.newInstance({ matrix });
  zRotation.postMultiply(); // rotate around Z, then apply centerline matrix
  zRotation.transformMatrices(centerlineBasesArray, rotatedBasesArray);

  centerline.modified();
  renderWindow.render();
}

// Load all the centerline JSONs
const centerlineJsons = {};
const centerlinesLoaded = centerlinePaths.map(async (centerlinePath, i) => {
  const response = await fetch(centerlinePath);
  const centerlineJSON = await response.json();
  centerlineJsons[centerlinePath] = centerlineJSON;
  if (i === 0) {
    setCenterlineJson(centerlineJSON);
  }
});

// When loaded, create an option for each centerline
Promise.all(centerlinesLoaded).then(() => {
  const centerlineEl = document.getElementById('centerline');
  const centerlineJsonsKeys = Object.keys(centerlineJsons);
  for (let i = 0; i < centerlineJsonsKeys.length; ++i) {
    const name = centerlineJsonsKeys[i];
    const optionEl = document.createElement('option');
    optionEl.innerText = name;
    optionEl.value = name;
    centerlineEl.appendChild(optionEl);
  }
  centerlineEl.addEventListener('input', () => {
    setCenterlineJson(centerlineJsons[centerlineEl.value]);
  });
});

const angleEl = document.getElementById('reformationAngle');
angleEl.addEventListener('input', (e) =>
  setCenterlineAngle(Number(e.target.value))
);

reader.setUrl(volumePath).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderWindow.render();

    global.imageData = reader.getOutputData();
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.centerline = centerline;
global.centerlineJsons = centerlineJsons;
