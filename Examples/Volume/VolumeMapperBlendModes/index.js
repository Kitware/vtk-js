import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.3],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const minHounsfieldLabel = document.querySelector('#minHounsfieldLabel');
const maxHounsfieldLabel = document.querySelector('#maxHounsfieldLabel');
const maxAbsorptionLabel = document.querySelector('#maxAbsorptionLabel');
const minAbsorptionLabel = document.querySelector('#minAbsorptionLabel');
const sampleDistanceLabel = document.querySelector('#sampleDistanceLabel');
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
const initialSampleDistance = 1.3;

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(initialSampleDistance);

// use half float at the cost of precision to save memory
mapper.setPreferSizeOverAccuracy(true);

actor.setMapper(mapper);

const radonParameters = {
  minHounsfield: 1000, // water HU for headsq (normally 0)
  minAbsorption: 0.01,
  maxHounsfield: 2500, // bone HU for headsq
  maxAbsorption: 0.03,
};
let sampleDistance = initialSampleDistance;
sampleDistanceLabel.innerHTML = sampleDistance.toFixed(1);

function updatePiecewiseFunction() {
  minHounsfieldLabel.innerHTML = radonParameters.minHounsfield.toFixed(0);
  minAbsorptionLabel.innerHTML = radonParameters.minAbsorption.toFixed(3);
  maxHounsfieldLabel.innerHTML = radonParameters.maxHounsfield.toFixed(0);
  maxAbsorptionLabel.innerHTML = radonParameters.maxAbsorption.toFixed(3);

  const currentBlendMode = mapper.getBlendMode();
  let opacityFunction;

  if (currentBlendMode === 5) {
    opacityFunction = vtkVolumeMapper.createRadonTransferFunction(
      radonParameters.minHounsfield,
      radonParameters.minAbsorption,
      radonParameters.maxHounsfield,
      radonParameters.maxAbsorption
    );
  } else {
    opacityFunction = vtkPiecewiseFunction.newInstance();
    opacityFunction.addPoint(-3024, 0.1);
    opacityFunction.addPoint(-637.62, 0.1);
    opacityFunction.addPoint(700, 0.5);
    opacityFunction.addPoint(3071, 0.9);
  }
  actor.getProperty().setScalarOpacity(0, opacityFunction);
}

actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.1);
actor.getProperty().setDiffuse(0.9);
actor.getProperty().setSpecular(0.2);
actor.getProperty().setSpecularPower(10.0);

mapper.setInputConnection(reader.getOutputPort());

function updateMin(event) {
  radonParameters.minHounsfield = event.target.valueAsNumber;
  updatePiecewiseFunction();
  renderWindow.render();
}

function updateMax(event) {
  radonParameters.maxHounsfield = event.target.valueAsNumber;
  updatePiecewiseFunction();
  renderWindow.render();
}

function updateScalarValue(event) {
  radonParameters.maxAbsorption = event.target.valueAsNumber;
  updatePiecewiseFunction();
  renderWindow.render();
}

function updateScalarValue2(event) {
  radonParameters.minAbsorption = event.target.valueAsNumber;
  updatePiecewiseFunction();
  renderWindow.render();
}

function updateSampleDistance(event) {
  sampleDistance = event.target.valueAsNumber;
  sampleDistanceLabel.innerHTML = sampleDistance.toFixed(3);
  mapper.setSampleDistance(sampleDistance);
  renderWindow.render();
}

function updateScalarMin(event) {
  mapper.setIpScalarRange(
    event.target.valueAsNumber,
    mapper.getIpScalarRange()[1]
  );
  renderWindow.render();
}

function updateScalarMax(event) {
  mapper.setIpScalarRange(
    mapper.getIpScalarRange()[0],
    event.target.valueAsNumber
  );
  renderWindow.render();
}

function updateBlendMode(event) {
  const currentBlendMode = parseInt(event.target.value, 10);
  const ipScalarEls = document.querySelectorAll('.ipScalar');
  const radonScalars = document.querySelectorAll('.radonScalar');

  mapper.setBlendMode(currentBlendMode);
  mapper.setIpScalarRange(0.0, 1.0);

  // if average or additive blend mode
  for (let i = 0; i < ipScalarEls.length; i += 1) {
    const el = ipScalarEls[i];
    el.style.display =
      currentBlendMode === 3 || currentBlendMode === 4 ? 'table-row' : 'none';
  }

  // Radon
  for (let i = 0; i < radonScalars.length; i += 1) {
    const el = radonScalars[i];
    el.style.display = currentBlendMode === 5 ? 'table-row' : 'none';
  }

  const colorTransferFunction = vtkColorTransferFunction.newInstance();
  if (currentBlendMode === 5) {
    colorTransferFunction.addRGBPoint(0, 0, 0, 0);
    colorTransferFunction.addRGBPoint(1, 1, 1, 1);
  } else {
    colorTransferFunction.addRGBPoint(-3024, 0, 0, 0);
    colorTransferFunction.addRGBPoint(-637.62, 0, 0, 0);
    colorTransferFunction.addRGBPoint(700, 1, 1, 1);
    colorTransferFunction.addRGBPoint(3071, 1, 1, 1);
  }
  actor.getProperty().setRGBTransferFunction(0, colorTransferFunction);
  updatePiecewiseFunction();

  renderWindow.render();
}

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(-70);
    updatePiecewiseFunction();

    const el = document.querySelector('.blendMode');
    el.addEventListener('change', updateBlendMode);

    const scalarMinEl = document.querySelector('.scalarMin');
    scalarMinEl.addEventListener('input', updateScalarMin);
    const scalarMaxEl = document.querySelector('.scalarMax');
    scalarMaxEl.addEventListener('input', updateScalarMax);

    const minInput = document.querySelector('.minHounsfield');
    minInput.addEventListener('input', updateMin);
    const maxInput = document.querySelector('.maxHounsfield');
    maxInput.addEventListener('input', updateMax);
    const maxAbsorptionInput = document.querySelector('.maxAbsorption');
    maxAbsorptionInput.addEventListener('input', updateScalarValue);
    const minAbsorptionInput = document.querySelector('.minAbsorption');
    minAbsorptionInput.addEventListener('input', updateScalarValue2);
    const unitV = document.querySelector('.sampleDistance');
    unitV.addEventListener('input', updateSampleDistance);

    minInput.value = radonParameters.minHounsfield;
    maxInput.value = radonParameters.maxHounsfield;
    maxAbsorptionInput.value = radonParameters.maxAbsorption;
    minAbsorptionInput.value = radonParameters.minAbsorption;
    unitV.value = sampleDistance;

    el.value = 5;
    const evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    el.dispatchEvent(evt);
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
