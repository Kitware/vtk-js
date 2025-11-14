import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import GUI from 'lil-gui';

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

const gui = new GUI();
let timeSeriesData = [];

const params = { TimeStep: 0, TimeValue: 'DOWNLOADING...' };
const timeCtrl = gui
  .add(params, 'TimeStep', 0, 1, 1)
  .name('Time step')
  .onChange((val) => {
    const activeDataset = timeSeriesData[Number(val)];
    if (activeDataset) {
      setVisibleDataset(activeDataset);
      params.TimeValue = getDataTimeStep(activeDataset);
    }
  });
gui.add(params, 'TimeValue').name('Time value').listen().disable();

// -----------------------------------------------------------
// example code logic
// -----------------------------------------------------------
downloadTimeSeries().then((downloadedData) => {
  timeSeriesData = downloadedData.filter((ds) => getDataTimeStep(ds) !== null);
  timeSeriesData.sort((a, b) => getDataTimeStep(a) - getDataTimeStep(b));

  timeCtrl.min(0);
  timeCtrl.max(timeSeriesData.length - 1);
  timeCtrl.step(1);
  params.TimeStep = 0;

  // set up camera
  renderer.getActiveCamera().setPosition(0, 55, -22);
  renderer.getActiveCamera().setViewUp(0, 0, -1);

  setVisibleDataset(timeSeriesData[0]);
  params.TimeValue = getDataTimeStep(timeSeriesData[0]);
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
