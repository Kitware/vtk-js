import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

import Constants from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import { compose } from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction/helpers';
import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';
import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';

import GUI from 'lil-gui';

const { SlicingMode } = Constants;

// ----------------------------------------------------------------------------
// Rendering setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.1, 0.1, 0.1],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const mapper = vtkImageMapper.newInstance();
mapper.setSlicingMode(SlicingMode.K);
mapper.setSliceAtFocalPoint(true);

const actor = vtkImageSlice.newInstance();
actor.setMapper(mapper);

const iStyle = vtkInteractorStyleImage.newInstance();
iStyle.setInteractionMode('IMAGE_SLICING');
renderWindow.getInteractor().setInteractorStyle(iStyle);

// ----------------------------------------------------------------------------
// Piecewise function composition — DICOM value transform pipeline
//
// Transforms are chained in order and stored as piecewise linear functions:
//   modalityFn  — modality LUT (maps raw storage values to manufacturer units)
//   voiFn       — values-of-interest / window-level (maps units to display range)
//   userFn      — interactive user adjustments (window / level ramp)
//
// The composed result is stored in resultFn and applied to the actor.
// ----------------------------------------------------------------------------

let modalityFn = vtkPiecewiseFunction.newInstance();
let voiFn = vtkPiecewiseFunction.newInstance();
const userFn = vtkPiecewiseFunction.newInstance();
const colorFn = vtkColorTransferFunction.newInstance();
const resultFn = vtkColorTransferFunction.newInstance();

/**
 * Output range [minY, maxY] of the given function. Segments are monotonic
 * between their endpoint values, so the extremes always sit on nodes.
 * @param {vtkPiecewiseFunction} fn
 * @returns Output range of the given function as a [min, max] tuple.
 */
function getOutputRange(fn) {
  const data = fn.getDataPointer();
  if (!data || data.length === 0) {
    return [0, 0];
  }
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < data.length; i += 2) {
    if (data[i] < minY) minY = data[i];
    if (data[i] > maxY) maxY = data[i];
  }
  return [minY, maxY];
}

function printFnRange(fn, name) {
  const inputRange = fn.getRange();
  const outputRange = getOutputRange(fn);
  console.log(
    `fn:${name} in-range: ${inputRange[0]}, ${inputRange[1]}, out-range: ${outputRange[0]}, ${outputRange[1]}`
  );
}

/**
 * Build a typically used shift-scale function as a vtkPiecewiseFunction.
 * @param {*} dataRange
 * @param {*} shift
 * @param {*} scale
 * @returns
 */
function buildShiftScaleFunction(dataRange, shift, scale) {
  const [min, max] = dataRange;
  const fn = vtkPiecewiseFunction.newInstance();
  fn.removeAllPoints();
  fn.addPoint(min, min * scale + shift);
  fn.addPoint(max, max * scale + shift);
  fn.setClamping(true);
  return fn;
}

function buildModalityFunction(dataRange, shift, scale) {
  modalityFn = buildShiftScaleFunction(dataRange, shift, scale);
  printFnRange(modalityFn, 'modalityFn');
}

function buildVoiFn(dataRange, shift, scale) {
  voiFn = buildShiftScaleFunction(
    // [dataRange[0] + 1000, dataRange[1] - 1000],
    [dataRange[0], dataRange[1]],
    shift,
    scale
  );
  printFnRange(voiFn, 'voiFn');
}

function buildUserFn(dataRange, colorWindow, colorLevel) {
  const [min, max] = dataRange;
  const lo = Math.max(min, colorLevel - colorWindow * 0.5);
  const hi = Math.min(max, colorLevel + colorWindow * 0.5);
  const colorFunctionXRange = colorFn.getRange();
  userFn.removeAllPoints();
  userFn.addPoint(lo, colorFunctionXRange[0]);
  userFn.addPoint(hi, colorFunctionXRange[1]);
  printFnRange(userFn, 'userFn');
}

function buildColorFunction(presetName) {
  colorFn.removeAllPoints();
  colorFn.applyColorMap(vtkColorMaps.getPresetByName(presetName));
}

function example_recompose() {
  const fnList = [modalityFn, voiFn, userFn];
  compose(fnList, colorFn, resultFn);
  actor.getProperty().setUseLookupTableScalarRange(true);
  actor.getProperty().setRGBTransferFunction(0, resultFn);
}

// ----------------------------------------------------------------------------
// Camera helpers
// ----------------------------------------------------------------------------

function resetCamera() {
  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(true);
  const [cx, cy, cz] = mapper.getInputData().getCenter();
  camera.setFocalPoint(cx, cy, cz);
  const normal = mapper.getSlicingModeNormal();
  camera.setPosition(cx - normal[0], cy - normal[1], cz - normal[2]);
  camera.setViewUp(0, -1, 0);
  renderer.resetCamera();
}

// ----------------------------------------------------------------------------
// Load overlay (visible before any file is loaded)
// ----------------------------------------------------------------------------

const body = document.querySelector('body');

const loadOverlay = document.createElement('div');
Object.assign(loadOverlay.style, {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.75)',
  zIndex: '10',
  color: '#fff',
  fontFamily: 'sans-serif',
});

const loadTitle = document.createElement('p');
loadTitle.innerText = 'Compose Piecewise Functions — DICOM Viewer';
Object.assign(loadTitle.style, { fontSize: '18px', marginBottom: '16px' });

const loadButton = document.createElement('button');
loadButton.innerText = 'Load DICOM File';
Object.assign(loadButton.style, {
  padding: '10px 24px',
  fontSize: '15px',
  cursor: 'pointer',
  borderRadius: '4px',
  border: 'none',
  background: '#4a90e2',
  color: '#fff',
});

const statusText = document.createElement('p');
statusText.style.marginTop = '12px';
statusText.style.fontSize = '13px';
statusText.innerText = '';

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.dcm,application/dicom,.nrrd';
fileInput.style.display = 'none';

loadButton.addEventListener('click', () => fileInput.click());

loadOverlay.appendChild(loadTitle);
loadOverlay.appendChild(loadButton);
loadOverlay.appendChild(statusText);
loadOverlay.appendChild(fileInput);
body.appendChild(loadOverlay);

// ----------------------------------------------------------------------------
// GUI controls (built after a file is loaded)
// ----------------------------------------------------------------------------

let gui = null;

function buildGui(dataRange, colorWindow, colorLevel) {
  if (gui) {
    gui.destroy();
  }
  gui = new GUI({ title: 'Piecewise Function Controls' });

  const params = {
    scalarRange: `[${dataRange[0]}, ${dataRange[1]}]`,
    modalityShift: 100,
    modalityScale: 0.8,
    voiShift: 50,
    voiScale: 0.9,
    colorWindow,
    colorLevel,
    preset: vtkColorMaps.rgbPresetNames[2],
    loadNewFile: () => {
      loadOverlay.style.display = 'flex';
      statusText.innerText = '';
      loadButton.innerText = 'Load DICOM File';
      loadButton.disabled = false;
      fileInput.value = '';
      gui.hide();
    },
  };

  gui.add(params, 'scalarRange').name('Scalar range').disable();

  // Initial build of the color transfer function.
  buildColorFunction(params.preset);

  // Modality transform
  buildModalityFunction(dataRange, params.modalityShift, params.modalityScale);
  // Values of interest transform
  buildVoiFn(dataRange, params.voiShift, params.voiScale);
  // User interactive adjustment (window/level)
  buildUserFn(getOutputRange(voiFn), params.colorWindow, params.colorLevel);
  // Compose into a single transfer function to feed into the mapper.
  example_recompose();

  function onModalityChange() {
    buildModalityFunction(
      dataRange,
      params.modalityShift,
      params.modalityScale
    );
    example_recompose();
    renderWindow.render();
  }

  function onUserFnChange() {
    buildUserFn(getOutputRange(voiFn), params.colorWindow, params.colorLevel);
    example_recompose();
    renderWindow.render();
  }

  // ---- Modality transform ----
  const modalityFolder = gui.addFolder('Modality transform');
  modalityFolder
    .add(params, 'modalityShift', -500, 500, 1)
    .name('Shift')
    .onChange(onModalityChange);
  modalityFolder
    .add(params, 'modalityScale', 0.1, 2.0, 0.01)
    .name('Scale')
    .onChange(onModalityChange);

  // ---- User adjustments (window / level) ----
  // The folder is created after the VOI folder below, but the controllers
  // are declared here so the VOI callbacks can update their ranges.
  let windowController;
  let levelController;

  function syncUserFnControllerRanges() {
    const [voiMin, voiMax] = getOutputRange(voiFn);
    const span = voiMax - voiMin;
    params.colorWindow = Math.min(Math.max(params.colorWindow, 1), span);
    params.colorLevel = Math.min(Math.max(params.colorLevel, voiMin), voiMax);
    windowController.min(1).max(span).updateDisplay();
    levelController.min(voiMin).max(voiMax).updateDisplay();
  }

  function onVoiChange() {
    buildVoiFn(dataRange, params.voiShift, params.voiScale);
    syncUserFnControllerRanges();
    buildUserFn(getOutputRange(voiFn), params.colorWindow, params.colorLevel);
    example_recompose();
    renderWindow.render();
  }

  // ---- VOI transform ----
  const voiFolder = gui.addFolder('VOI transform (values of interest)');
  voiFolder
    .add(params, 'voiShift', -500, 500, 1)
    .name('Shift')
    .onChange(onVoiChange);
  voiFolder
    .add(params, 'voiScale', 0.1, 2.0, 0.01)
    .name('Scale')
    .onChange(onVoiChange);

  const userFolder = gui.addFolder('User adjustments (window / level)');
  const [voiMin, voiMax] = getOutputRange(voiFn);
  windowController = userFolder
    .add(params, 'colorWindow', 1, voiMax - voiMin, 1)
    .name('Window')
    .onChange(onUserFnChange);
  levelController = userFolder
    .add(params, 'colorLevel', voiMin, voiMax, 1)
    .name('Level')
    .onChange(onUserFnChange);

  // ---- Color map ----
  gui
    .add(params, 'preset', vtkColorMaps.rgbPresetNames)
    .name('Color map')
    .onChange((presetName) => {
      buildColorFunction(presetName);
      example_recompose();
      renderWindow.render();
    });

  gui.add(params, 'loadNewFile').name('Load New File');
}

// ----------------------------------------------------------------------------
// DICOM load + render
// ----------------------------------------------------------------------------

function renderDicom(file) {
  statusText.innerText = 'Reading file…';
  const reader = new FileReader();
  reader.onload = async (e) => {
    statusText.innerText = 'Decoding DICOM…';
    const { image: itkImage, webWorker } =
      await window.itk.readImageArrayBuffer(null, e.target.result, file.name);
    webWorker.terminate();

    const imageData = vtkITKHelper.convertItkToVtkImage(itkImage);
    mapper.setInputData(imageData);

    const scalars = imageData.getPointData().getScalars();
    const dataRange = scalars.getRange();

    const colorWindow = (dataRange[1] - dataRange[0]) / 4.0;
    const colorLevel = Math.round((dataRange[0] + dataRange[1]) / 2);

    buildGui(dataRange, colorWindow, colorLevel);

    if (!renderer.getActors().length) {
      renderer.addActor(actor);
    }
    resetCamera();
    renderWindow.render();

    // Hide overlay, show controls
    loadOverlay.style.display = 'none';
    gui.show();
  };
  reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------------------------------
// itk-wasm bootstrap
// ----------------------------------------------------------------------------

let itkReady = false;

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (itkReady) {
    renderDicom(file);
  } else {
    loadButton.innerText = 'Loading itk-wasm…';
    loadButton.disabled = true;
    statusText.innerText = 'Downloading DICOM decoder…';
    vtkResourceLoader
      .loadScript(
        'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.js'
      )
      .then(() => {
        itkReady = true;
        renderDicom(file);
      });
  }
});

// Pre-fetch itk-wasm in the background so first load is faster
vtkResourceLoader
  .loadScript(
    'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.js'
  )
  .then(() => {
    itkReady = true;
  });

// -----------------------------------------------------------
// Global references for browser console inspection
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.modalityFn = modalityFn;
global.voiFn = voiFn;
global.userFn = userFn;
global.resultFn = resultFn;
global.colorFn = colorFn;
