import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Profiles/LIC';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkSurfaceLICMapper from 'vtk.js/Sources/Rendering/Core/SurfaceLICMapper';

import controlPanel from './controller.html';

const { GetArray } = vtkMapper;

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const reader = vtkXMLPolyDataReader.newInstance();

const mapper = vtkSurfaceLICMapper.newInstance();
const licInterface = mapper.getLicInterface();
const actor = vtkActor.newInstance();
actor.setMapper(mapper);

const lut = mapper.getLookupTable();
lut.setVectorModeToMagnitude();

mapper.setInputConnection(reader.getOutputPort());
mapper.setInputArrayToProcess(0, 'V', 'PointData', '');
mapper.setColorByArrayName('V');
mapper.setScalarModeToUsePointFieldData();
mapper.setArrayAccessMode(GetArray.BY_NAME);
mapper.setScalarVisibility(true);

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

function updateLIC() {
  const enableLIC = document.querySelector('#enableLIC').checked;
  const numberOfSteps = Number.parseInt(
    document.querySelector('#numberOfSteps').value,
    10
  );
  const stepSize = Number.parseFloat(document.querySelector('#stepSize').value);
  const normalizeVectors = document.querySelector('#normalizeVectors').checked;
  const enhancedLIC = document.querySelector('#enhancedLIC').checked;
  const LICIntensity = Number.parseFloat(
    document.querySelector('#LICIntensity').value
  );
  const viewPortScale = Number.parseFloat(
    document.querySelector('#viewPortScale').value
  );
  const antiAlias = Number.parseInt(
    document.querySelector('#antiAlias').value,
    10
  );
  const noiseTextureSize = Number.parseInt(
    document.querySelector('#noiseTextureSize').value,
    10
  );
  const noiseGrainSize = Number.parseInt(
    document.querySelector('#noiseGrainSize').value,
    10
  );
  const numberOfNoiseLevels = Number.parseInt(
    document.querySelector('#numberOfNoiseLevels').value,
    10
  );
  const minNoiseValue = Number.parseFloat(
    document.querySelector('#minNoiseValue').value
  );
  const maxNoiseValue = Number.parseFloat(
    document.querySelector('#maxNoiseValue').value
  );
  const noiseImpulseProbability = Number.parseFloat(
    document.querySelector('#noiseImpulseProbability').value
  );
  const noiseSeed = Number.parseFloat(
    document.querySelector('#noiseSeed').value
  );

  const contrast = Number.parseInt(
    document.querySelector('#contrast').value,
    10
  );
  const noiseType = Number.parseInt(
    document.querySelector('#noiseType').value,
    10
  );
  const colorMode = Number.parseInt(
    document.querySelector('#colorMode').value,
    10
  );

  licInterface.setEnableLIC(enableLIC);
  licInterface.setNumberOfSteps(numberOfSteps);
  licInterface.setStepSize(stepSize);
  licInterface.setNormalizeVectors(normalizeVectors);
  licInterface.setEnhancedLIC(enhancedLIC);
  licInterface.setLICIntensity(LICIntensity);
  licInterface.setViewPortScale(viewPortScale);
  licInterface.setAntiAlias(antiAlias);
  licInterface.setNoiseTextureSize(noiseTextureSize);
  licInterface.setNumberOfNoiseLevels(numberOfNoiseLevels);
  licInterface.setNoiseGrainSize(noiseGrainSize);
  licInterface.setMinNoiseValue(minNoiseValue);
  licInterface.setMaxNoiseValue(maxNoiseValue);
  licInterface.setNoiseImpulseProbability(noiseImpulseProbability);
  licInterface.setNoiseGeneratorSeed(noiseSeed);

  licInterface.setNoiseTextureType(noiseType);
  licInterface.setColorMode(colorMode);
  licInterface.setEnhanceContrast(contrast);

  renderWindow.render();
}

function rebuildNoiseTexture() {
  licInterface.setRebuildNoiseTexture(true);
  renderWindow.render();
}

function initControls() {
  document.querySelector('#viewPortScale').value = 1 / window.devicePixelRatio;

  const ids = [
    '#enableLIC',
    '#numberOfSteps',
    '#stepSize',
    '#normalizeVectors',
    '#enhancedLIC',
    '#LICIntensity',
    '#viewPortScale',
    '#antiAlias',
    '#contrast',
    '#noiseType',
    '#noiseTextureSize',
    '#noiseGrainSize',
    '#numberOfNoiseLevels',
    '#minNoiseValue',
    '#maxNoiseValue',
    '#noiseImpulseProbability',
    '#noiseSeed',
    '#colorMode',
  ];
  ids.forEach((id) => {
    document.querySelector(id).addEventListener('change', updateLIC);
  });

  document
    .querySelector('#rebuildNoise')
    .addEventListener('click', rebuildNoiseTexture);
}
// ----------------------------------------------------------------------------

function update() {
  renderer.addActor(actor);

  renderer.resetCamera();
  renderer.getActiveCamera().azimuth(160);

  fullScreenRenderer.addController(controlPanel);
  initControls();
  updateLIC();
}

// ----------------------------------------------------------------------------
// Use a file reader to load a local file
// ----------------------------------------------------------------------------

// const myContainer = document.querySelector('body');
// const fileContainer = document.createElement('div');
// fileContainer.innerHTML = '<input type="file" class="file"/>';
// myContainer.appendChild(fileContainer);

// const fileInput = fileContainer.querySelector('input');

// function handleFile(event) {
//   event.preventDefault();
//   const dataTransfer = event.dataTransfer;
//   const files = event.target.files || dataTransfer.files;
//   if (files.length === 1) {
//     myContainer.removeChild(fileContainer);
//     const fileReader = new FileReader();
//     fileReader.onload = function onLoad(e) {
//       reader.parseAsArrayBuffer(fileReader.result);
//       update();
//     };
//     fileReader.readAsArrayBuffer(files[0]);
//   }
// }

// fileInput.addEventListener('change', handleFile);

// ----------------------------------------------------------------------------
// Use the reader to download a file
// ----------------------------------------------------------------------------

reader
  .setUrl(
    'https://kitware.github.io/vtk-js-datasets/data/vtp/disk_out_ref_surface.vtp',
    { binary: true }
  )
  .then(update);
