import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkHttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import controlPanel from './controller.html';

const { fetchBinary } = vtkHttpDataAccessHelper;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const mapper = vtkMapper.newInstance();
mapper.setInputData(vtkPolyData.newInstance());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Download a series of VTP files in a time series, sort them by time, and
// then display them in a playback series.
// ----------------------------------------------------------------------------

const BASE_URL = 'https://kitware.github.io/vtk-js-datasets/data/vtp/can/';

function downloadTimeSeries() {
  const files = [
    'can_0.vtp',
    'can_5.vtp',
    'can_10.vtp',
    'can_15.vtp',
    'can_20.vtp',
    'can_25.vtp',
    'can_30.vtp',
    'can_35.vtp',
    'can_40.vtp',
  ];
  return Promise.all(
    files.map((filename) =>
      fetchBinary(`${BASE_URL}/${filename}`).then((binary) => {
        const reader = vtkXMLPolyDataReader.newInstance();
        reader.parseAsArrayBuffer(binary);
        return reader.getOutputData(0);
      })
    )
  );
}

function getDataTimeStep(vtkObj) {
  const arr = vtkObj.getFieldData().getArrayByName('TimeValue');
  if (arr) {
    return arr.getData()[0];
  }
  return null;
}

function setVisibleDataset(ds) {
  mapper.setInputData(ds);
  renderer.resetCamera();
  renderWindow.render();
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

function uiUpdateSlider(max) {
  const timeslider = document.querySelector('#timeslider');
  timeslider.min = 0;
  timeslider.max = max - 1;
  timeslider.step = 1;
}

fullScreenRenderer.addController(controlPanel);

// -----------------------------------------------------------
// example code logic
// -----------------------------------------------------------

let timeSeriesData = [];

const timeslider = document.querySelector('#timeslider');
const timevalue = document.querySelector('#timevalue');

timeslider.addEventListener('input', (e) => {
  const activeDataset = timeSeriesData[Number(e.target.value)];
  if (activeDataset) {
    setVisibleDataset(activeDataset);
    timevalue.innerText = getDataTimeStep(activeDataset);
  }
});

downloadTimeSeries().then((downloadedData) => {
  timeSeriesData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
  timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

  uiUpdateSlider(timeSeriesData.length);
  timeslider.value = 0;

  // set up camera
  renderer.getActiveCamera().setPosition(0, 55, -22);
  renderer.getActiveCamera().setViewUp(0, 0, -1);

  setVisibleDataset(timeSeriesData[0]);
  timevalue.innerText = getDataTimeStep(timeSeriesData[0]);
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
