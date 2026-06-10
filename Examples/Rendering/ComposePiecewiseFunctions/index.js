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
 *
 * @param {vtkPiecewiseFunction} fn
 * @returns Output range of the given function as a tuple, using its maximum input range.
 */
function getOutputRange(fn) {
  const inputRange = fn.getRange();
  return [fn.getValue(inputRange[0]), fn.getValue(inputRange[1])];
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

function example_recompose(dataRange) {
  const fnList = [modalityFn, voiFn, userFn];
  compose(dataRange, fnList, colorFn, resultFn);
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
// UI helpers
// ----------------------------------------------------------------------------

const body = document.querySelector('body');

function makeSlider(
  label,
  min,
  max,
  value,
  step,
  onChange,
  format = Math.round
) {
  const wrap = document.createElement('div');
  wrap.style.marginBottom = '10px';

  const lbl = document.createElement('label');
  lbl.style.display = 'block';
  lbl.style.marginBottom = '2px';

  const valueSpan = document.createElement('span');
  valueSpan.innerText = ` ${format(value)}`;

  lbl.appendChild(document.createTextNode(label));
  lbl.appendChild(valueSpan);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.value = value;
  input.step = step;
  input.style.width = '100%';

  input.addEventListener('input', () => {
    valueSpan.innerText = ` ${format(Number(input.value))}`;
    onChange(Number(input.value));
  });

  wrap.appendChild(lbl);
  wrap.appendChild(input);
  return { wrap, input };
}

// ----------------------------------------------------------------------------
// Load overlay (visible before any file is loaded)
// ----------------------------------------------------------------------------

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
// Controls panel (visible after a file is loaded)
// ----------------------------------------------------------------------------

const controlPanel = document.createElement('div');
Object.assign(controlPanel.style, {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(0,0,0,0.7)',
  color: '#fff',
  fontFamily: 'sans-serif',
  fontSize: '13px',
  padding: '12px',
  borderRadius: '6px',
  display: 'none',
  minWidth: '230px',
  zIndex: '5',
});
body.appendChild(controlPanel);

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

    let modalityShift = 100;
    let modalityScale = 0.8;
    let voiShift = 50;
    let voiScale = 0.9;
    let currentPreset = vtkColorMaps.rgbPresetNames[2];

    // Modality transform
    buildModalityFunction(dataRange, modalityShift, modalityScale);
    // Values of interest transform
    buildVoiFn(dataRange, voiShift, voiScale);
    // User interactive adjustment (window/level)
    buildUserFn(getOutputRange(voiFn), colorWindow, colorLevel);
    buildColorFunction(currentPreset);
    // Compose into a single transferfunction to feed into the mapper.
    example_recompose(dataRange);

    if (!renderer.getActors().length) {
      renderer.addActor(actor);
    }
    resetCamera();
    renderWindow.render();

    // Hide overlay, populate and show controls
    loadOverlay.style.display = 'none';
    controlPanel.innerHTML = '';

    const heading = document.createElement('div');
    heading.innerText = 'Piecewise Function Controls';
    Object.assign(heading.style, {
      fontWeight: 'bold',
      marginBottom: '6px',
      fontSize: '14px',
    });
    controlPanel.appendChild(heading);

    const rangeLabel = document.createElement('div');
    rangeLabel.innerText = `Scalar range: [${dataRange[0]}, ${dataRange[1]}]`;
    Object.assign(rangeLabel.style, {
      fontSize: '11px',
      color: '#aaa',
      marginBottom: '10px',
    });
    controlPanel.appendChild(rangeLabel);

    const scaleFormat = (v) => v.toFixed(2);

    // ---- Modality transform ----
    const modalityHeading = document.createElement('div');
    modalityHeading.innerText = 'Modality transform';
    Object.assign(modalityHeading.style, {
      fontSize: '11px',
      color: '#aaa',
      marginBottom: '4px',
    });
    controlPanel.appendChild(modalityHeading);

    const { input: modalityShiftInput } = makeSlider(
      'Shift:',
      -500,
      500,
      modalityShift,
      1,
      (val) => {
        modalityShift = val;
        buildModalityFunction(dataRange, modalityShift, modalityScale);
        example_recompose(dataRange);
        renderWindow.render();
      }
    );
    controlPanel.appendChild(modalityShiftInput.parentElement);

    const { input: modalityScaleInput } = makeSlider(
      'Scale:',
      0.1,
      2.0,
      modalityScale,
      0.01,
      (val) => {
        modalityScale = val;
        buildModalityFunction(dataRange, modalityShift, modalityScale);
        example_recompose(dataRange);
        renderWindow.render();
      },
      scaleFormat
    );
    controlPanel.appendChild(modalityScaleInput.parentElement);

    // Pre-declare so VOI callbacks can close over them before User section runs
    let windowInput;
    let levelInput;

    function syncUserFnSliderRanges() {
      const [voiMin, voiMax] = getOutputRange(voiFn);
      const span = voiMax - voiMin;
      windowInput.min = 1;
      windowInput.max = span;
      windowInput.value = Math.min(
        Math.max(Number(windowInput.value), 1),
        span
      );
      levelInput.min = voiMin;
      levelInput.max = voiMax;
      levelInput.value = Math.min(
        Math.max(Number(levelInput.value), voiMin),
        voiMax
      );
    }

    // ---- VOI transform ----
    const composeHeading = document.createElement('div');
    composeHeading.innerText = 'VOI transform (values of interest)';
    Object.assign(composeHeading.style, {
      fontSize: '11px',
      color: '#aaa',
      margin: '8px 0 4px',
    });
    controlPanel.appendChild(composeHeading);

    const { input: voiShiftInput } = makeSlider(
      'Shift:',
      -500,
      500,
      voiShift,
      1,
      (val) => {
        voiShift = val;
        buildVoiFn(dataRange, voiShift, voiScale);
        syncUserFnSliderRanges();
        buildUserFn(
          getOutputRange(voiFn),
          Number(windowInput.value),
          Number(levelInput.value)
        );
        example_recompose(dataRange);
        renderWindow.render();
      }
    );
    controlPanel.appendChild(voiShiftInput.parentElement);

    const { input: voiScaleInput } = makeSlider(
      'Scale:',
      0.1,
      2.0,
      voiScale,
      0.01,
      (val) => {
        voiScale = val;
        buildVoiFn(dataRange, voiShift, voiScale);
        syncUserFnSliderRanges();
        buildUserFn(
          getOutputRange(voiFn),
          Number(windowInput.value),
          Number(levelInput.value)
        );
        example_recompose(dataRange);
        renderWindow.render();
      },
      scaleFormat
    );
    controlPanel.appendChild(voiScaleInput.parentElement);

    // ---- User adjustments ----
    const wlHeading = document.createElement('div');
    wlHeading.innerText = 'User adjustments (window / level)';
    Object.assign(wlHeading.style, {
      fontSize: '11px',
      color: '#aaa',
      margin: '8px 0 4px',
    });
    controlPanel.appendChild(wlHeading);

    ({ input: windowInput } = makeSlider(
      'Window:',
      1,
      getOutputRange(voiFn)[1] - getOutputRange(voiFn)[0],
      colorWindow,
      1,
      (val) => {
        buildUserFn(getOutputRange(voiFn), val, Number(levelInput.value));
        buildColorFunction(currentPreset);
        example_recompose(dataRange);
        renderWindow.render();
      }
    ));
    controlPanel.appendChild(windowInput.parentElement);

    ({ input: levelInput } = makeSlider(
      'Level:',
      getOutputRange(voiFn)[0],
      getOutputRange(voiFn)[1],
      colorLevel,
      1,
      (val) => {
        buildUserFn(getOutputRange(voiFn), Number(windowInput.value), val);
        buildColorFunction(currentPreset);
        example_recompose(dataRange);
        renderWindow.render();
      }
    ));
    controlPanel.appendChild(levelInput.parentElement);

    // ---- Color map ----
    const colorMapHeading = document.createElement('div');
    colorMapHeading.innerText = 'Color map';
    Object.assign(colorMapHeading.style, {
      fontSize: '11px',
      color: '#aaa',
      margin: '8px 0 4px',
    });
    controlPanel.appendChild(colorMapHeading);

    const presetSelector = document.createElement('select');
    presetSelector.innerHTML = vtkColorMaps.rgbPresetNames
      .map(
        (name) =>
          `<option value="${name}" ${
            name === currentPreset ? 'selected="selected"' : ''
          }>${name}</option>`
      )
      .join('');
    Object.assign(presetSelector.style, {
      width: '100%',
      background: '#333',
      color: '#fff',
      border: '1px solid #555',
      borderRadius: '3px',
      padding: '3px',
      fontSize: '12px',
    });
    presetSelector.addEventListener('change', () => {
      currentPreset = presetSelector.value;
      buildColorFunction(currentPreset);
      example_recompose(dataRange);
      renderWindow.render();
    });
    controlPanel.appendChild(presetSelector);

    // ---- Reload button ----
    const reloadBtn = document.createElement('button');
    reloadBtn.innerText = 'Load New File';
    Object.assign(reloadBtn.style, {
      marginTop: '10px',
      padding: '6px 12px',
      cursor: 'pointer',
      background: '#4a90e2',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      width: '100%',
    });
    reloadBtn.addEventListener('click', () => {
      loadOverlay.style.display = 'flex';
      statusText.innerText = '';
      loadButton.innerText = 'Load DICOM File';
      loadButton.disabled = false;
      controlPanel.style.display = 'none';
      fileInput.value = '';
    });
    controlPanel.appendChild(reloadBtn);

    controlPanel.style.display = 'block';
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
