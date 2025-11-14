import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/LIC';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtkSurfaceLICMapper from '@kitware/vtk.js/Rendering/Core/SurfaceLICMapper';

import GUI from 'lil-gui';

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

const params = {
  enableLIC: true,
  numberOfSteps: 30,
  stepSize: 0.5,
  normalizeVectors: true,
  enhancedLIC: true,
  LICIntensity: 0.8,
  viewPortScale: 1 / window.devicePixelRatio,
  antiAlias: 1,
  contrast: 2,
  noiseType: 1,
  noiseTextureSize: 256,
  noiseGrainSize: 1,
  numberOfNoiseLevels: 4,
  minNoiseValue: 0.0,
  maxNoiseValue: 1.0,
  noiseImpulseProbability: 0.2,
  noiseSeed: 0,
  colorMode: 0,
};
function updateLIC() {
  licInterface.setEnableLIC(params.enableLIC);
  licInterface.setNumberOfSteps(Number(params.numberOfSteps));
  licInterface.setStepSize(Number(params.stepSize));
  licInterface.setNormalizeVectors(params.normalizeVectors);
  licInterface.setEnhancedLIC(params.enhancedLIC);
  licInterface.setLICIntensity(Number(params.LICIntensity));
  licInterface.setViewPortScale(Number(params.viewPortScale));
  licInterface.setAntiAlias(Number(params.antiAlias));
  licInterface.setNoiseTextureSize(Number(params.noiseTextureSize));
  licInterface.setNumberOfNoiseLevels(Number(params.numberOfNoiseLevels));
  licInterface.setNoiseGrainSize(Number(params.noiseGrainSize));
  licInterface.setMinNoiseValue(Number(params.minNoiseValue));
  licInterface.setMaxNoiseValue(Number(params.maxNoiseValue));
  licInterface.setNoiseImpulseProbability(
    Number(params.noiseImpulseProbability)
  );
  licInterface.setNoiseGeneratorSeed(Number(params.noiseSeed));

  licInterface.setNoiseTextureType(Number(params.noiseType));
  licInterface.setColorMode(Number(params.colorMode));
  licInterface.setEnhanceContrast(Number(params.contrast));

  renderWindow.render();
}

function rebuildNoiseTexture() {
  licInterface.setRebuildNoiseTexture(true);
  renderWindow.render();
}

function initControls() {
  const gui = new GUI();
  const licFolder = gui.addFolder('LIC Configuration');
  licFolder.add(params, 'enableLIC').name('Enable LIC').onChange(updateLIC);
  licFolder
    .add(params, 'numberOfSteps', 0, 100, 1)
    .name('Number of steps')
    .onChange(updateLIC);
  licFolder
    .add(params, 'stepSize', 0, 100, 0.1)
    .name('Step size')
    .onChange(updateLIC);
  licFolder
    .add(params, 'normalizeVectors')
    .name('Normalize vectors')
    .onChange(updateLIC);
  licFolder.add(params, 'enhancedLIC').name('Enhanced LIC').onChange(updateLIC);
  licFolder
    .add(params, 'LICIntensity', 0, 1, 0.01)
    .name('LIC Intensity')
    .onChange(updateLIC);
  licFolder
    .add(params, 'colorMode', { Blend: 0, Multiply: 1 })
    .name('Color Mode')
    .onChange(updateLIC);
  licFolder
    .add(params, 'antiAlias', 0, 100, 1)
    .name('Anti aliasing steps')
    .onChange(updateLIC);
  licFolder
    .add(params, 'contrast', { None: 0, LIC: 1, Color: 2, Both: 3 })
    .name('Contrast enhance')
    .onChange(updateLIC);
  licFolder
    .add(params, 'viewPortScale', 0, 1, 0.1)
    .name('Viewport scale')
    .onChange(updateLIC);

  const noiseFolder = gui.addFolder('Noise texture');
  noiseFolder
    .add(params, 'noiseType', { Uniform: 0, Gaussian: 1 })
    .name('Noise texture type')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'noiseTextureSize', 16, 2048, 1)
    .name('Noise texture size')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'noiseGrainSize', 1, 1000, 1)
    .name('Noise grain size')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'numberOfNoiseLevels', 1, 1000, 1)
    .name('Number of noise levels')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'minNoiseValue', 0.0, 1.0, 0.01)
    .name('Min noise value')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'maxNoiseValue', 0.0, 1.0, 0.01)
    .name('Max noise value')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'noiseImpulseProbability', 0.0, 1.0, 0.01)
    .name('Impulse probability')
    .onChange(updateLIC);
  noiseFolder
    .add(params, 'noiseSeed', 0, 1000, 1)
    .name('RNG seed')
    .onChange(updateLIC);
  noiseFolder
    .add({ rebuildNoiseTexture }, 'rebuildNoiseTexture')
    .name('Rebuild noise texture');
}
// ----------------------------------------------------------------------------

function update() {
  renderer.addActor(actor);

  renderer.resetCamera();
  renderer.getActiveCamera().azimuth(160);

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
