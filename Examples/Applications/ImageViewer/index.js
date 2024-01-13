/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import macro from '@kitware/vtk.js/macros';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
import Constants from '@kitware/vtk.js/Rendering/Core/ImageMapper/Constants';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';
import vtkScalarBarActor from 'vtk.js/Sources/Rendering/Core/ScalarBarActor';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import style from './ImageViewer.module.css';
import icon from '../../../Documentation/content/icon/favicon-96x96.png';

const { SlicingMode } = Constants;

// Process arguments from URL
const userParams = vtkURLExtract.extractURLParameters();

let autoInit = true;
let background = [0, 0, 0];
const lutName = userParams.lut || 'Grayscale';
const lookupTable = vtkColorTransferFunction.newInstance();

// Background handling
if (userParams.background) {
  background = userParams.background.split(',').map((s) => Number(s));
}
const selectorClass =
  background.length === 3 && background.reduce((a, b) => a + b, 0) < 1.5
    ? style.dark
    : style.light;

// ----------------------------------------------------------------------------
// DOM containers for UI control
// ----------------------------------------------------------------------------

const rootControllerContainer = document.createElement('div');
rootControllerContainer.setAttribute('class', style.rootController);

const addDataSetButton = document.createElement('img');
addDataSetButton.setAttribute('class', style.button);
addDataSetButton.setAttribute('src', icon);
addDataSetButton.addEventListener('click', () => {
  const isVisible = rootControllerContainer.style.display !== 'none';
  rootControllerContainer.style.display = isVisible ? 'none' : 'flex';
});

const fpsMonitor = vtkFPSMonitor.newInstance();
const fpsElm = fpsMonitor.getFpsMonitorContainer();
fpsElm.classList.add(style.fpsMonitor);

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

// ----------------------------------------------------------------------------

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// ----------------------------------------------------------------------------

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function createUI(renderWindow, interactorStyle, imageSlice) {
  const image = imageSlice.getMapper().getInputData();
  const scalars = image.getPointData().getScalars();
  const info = document.createElement('label');
  info.innerText = `w: ${image.getDimensions()[0]}px h: ${
    image.getDimensions()[1]
  }px d: ${image.getDimensions()[2]}px
  ${scalars.getDataType()} min: ${scalars.getRange()[0]} max: ${
    scalars.getRange()[1]
  }`;

  // --------------------------------------------------------------------
  // Color handling
  // --------------------------------------------------------------------

  const presetSelector = document.createElement('select');
  presetSelector.setAttribute('class', selectorClass);
  presetSelector.innerHTML = vtkColorMaps.rgbPresetNames
    .map(
      (name) =>
        `<option value="${name}" ${
          lutName === name ? 'selected="selected"' : ''
        }>${name}</option>`
    )
    .join('');

  function applyPreset() {
    const preset = vtkColorMaps.getPresetByName(presetSelector.value);
    lookupTable.applyColorMap(preset);
    lookupTable.setMappingRange(...scalars.getRange());
    lookupTable.updateRange();
    renderWindow.getInteractor().render();
  }
  applyPreset();
  presetSelector.addEventListener('change', applyPreset);

  const windowLabel = document.createElement('label');
  windowLabel.for = 'window';
  windowLabel.innerText = 'Window:';
  const windowSelector = document.createElement('input');
  windowSelector.setAttribute('class', selectorClass);
  windowSelector.setAttribute('id', 'window');
  windowSelector.type = 'number';

  const levelLabel = document.createElement('label');
  levelLabel.for = 'level';
  levelLabel.innerText = 'Level:';
  const levelSelector = document.createElement('input');
  levelSelector.setAttribute('class', selectorClass);
  levelSelector.setAttribute('id', 'level');
  levelSelector.type = 'number';
  const windowLevel = document.createElement('div');
  windowLevel.appendChild(windowLabel);
  windowLevel.appendChild(windowSelector);
  windowLevel.appendChild(levelLabel);
  windowLevel.appendChild(levelSelector);

  function updateWindowLevelSelectors() {
    windowSelector.value = imageSlice.getProperty().getColorWindow();
    levelSelector.value = imageSlice.getProperty().getColorLevel();
  }
  updateWindowLevelSelectors();
  interactorStyle.onInteractionEvent(updateWindowLevelSelectors);

  function updateWindowLevel() {
    imageSlice.getProperty().setColorWindow(Number(windowSelector.value));
    imageSlice.getProperty().setColorLevel(Number(levelSelector.value));
    renderWindow.getInteractor().render();
  }
  windowSelector.addEventListener('input', updateWindowLevel);
  levelSelector.addEventListener('input', updateWindowLevel);

  const interpolationLabel = document.createElement('label');
  interpolationLabel.for = 'interpolation';
  interpolationLabel.innerText = 'Linear interpolation:';
  const interpolationSelector = document.createElement('input');
  interpolationSelector.setAttribute('class', selectorClass);
  interpolationSelector.setAttribute('id', 'interpolation');
  interpolationSelector.type = 'checkbox';
  interpolationSelector.checked = true;
  const interpolation = document.createElement('div');
  interpolation.appendChild(interpolationLabel);
  interpolation.appendChild(interpolationSelector);

  function updateInterpolation() {
    if (interpolationSelector.checked) {
      imageSlice.getProperty().setInterpolationTypeToLinear();
    } else {
      imageSlice.getProperty().setInterpolationTypeToNearest();
    }
    renderWindow.getInteractor().render();
  }
  interpolationSelector.addEventListener('input', updateInterpolation);

  const controlContainer = document.createElement('div');
  controlContainer.setAttribute('class', style.control);
  controlContainer.appendChild(info);
  controlContainer.appendChild(presetSelector);
  controlContainer.appendChild(windowLevel);
  controlContainer.appendChild(interpolation);
  rootControllerContainer.appendChild(controlContainer);
}
// ----------------------------------------------------------------------------

function createViewer(rootContainer, fileContents, options) {
  const rwBackground = options.background
    ? options.background.split(',').map((s) => Number(s))
    : background;
  const containerStyle = options.containerStyle;
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: rwBackground,
    rootContainer,
    containerStyle,
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  renderWindow.getInteractor().setDesiredUpdateRate(30);

  const vtiReader = vtkXMLImageDataReader.newInstance();
  vtiReader.parseAsArrayBuffer(fileContents);

  const source = vtiReader.getOutputData(0);
  const mapper = vtkImageMapper.newInstance();
  const actor = vtkImageSlice.newInstance();

  const piecewiseFunction = vtkPiecewiseFunction.newInstance();

  // Pipeline handling
  actor.setMapper(mapper);
  mapper.setInputData(source);
  mapper.setSliceAtFocalPoint(true);
  mapper.setSlicingMode(SlicingMode.Z);
  renderer.addActor(actor);

  // Configuration
  // Uncomment this if you want to use a fixed colorwindow/level
  actor.getProperty().setRGBTransferFunction(0, lookupTable);
  // actor.getProperty().setScalarOpacity(0, piecewiseFunction);

  const bounds = source.getBounds();
  const camera = renderer.getActiveCamera();

  camera.setFocalPoint(...vtkBoundingBox.getCenter(bounds));
  const position = camera.getFocalPoint();
  // offset along the slicing axis
  const normal = mapper.getSlicingModeNormal();
  position[0] += normal[0];
  position[1] += normal[1];
  position[2] += normal[2];
  camera.setPosition(...position);
  switch (mapper.getSlicingMode()) {
    case SlicingMode.X:
      camera.setViewUp([0, 1, 0]);
      camera.setParallelScale((bounds[1] - bounds[0]) / 2);
      break;
    case SlicingMode.Y:
      camera.setViewUp([1, 0, 0]);
      camera.setParallelScale((bounds[5] - bounds[4]) / 2);
      break;
    case SlicingMode.Z:
      camera.setViewUp([0, 1, 0]);
      camera.setParallelScale((bounds[1] - bounds[0]) / 2);
      break;
    default:
  }
  camera.setParallelProjection(true);

  const scalarBarActor = vtkScalarBarActor.newInstance();
  scalarBarActor.setAxisLabel('foo');
  // scalarBarActor.setBoxPosition(-1.0, -0.5);
  // scalarBarActor.setBoxSize(2.0, 1.0);
  scalarBarActor.setVisibility(true);
  renderer.addActor(scalarBarActor);
  scalarBarActor.setScalarsToColors(
    actor.getProperty().getRGBTransferFunction()
  );

  const iStyle = vtkInteractorStyleImage.newInstance();
  iStyle.setInteractionMode('IMAGE_SLICING');
  renderWindow.getInteractor().setInteractorStyle(iStyle);

  createUI(renderWindow, iStyle, actor);
  rootContainer.appendChild(rootControllerContainer);

  // First render
  // renderer.resetCamera();
  renderWindow.render();

  global.pipeline = {
    actor,
    renderer,
    renderWindow,
    lookupTable,
    mapper,
    source,
    piecewiseFunction,
    fullScreenRenderer,
    scalarBarActor,
  };

  if (userParams.fps) {
    fpsElm.classList.add(style.fpsMonitor);
    fpsMonitor.setRenderWindow(renderWindow);
    fpsMonitor.setContainer(rootContainer);
    fpsMonitor.update();
  }
}

// ----------------------------------------------------------------------------

export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  if (options.file) {
    if (options.ext === 'vti') {
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        createViewer(container, reader.result, options);
      };
      reader.readAsArrayBuffer(options.file);
    } else {
      console.error('Unkown file...');
    }
  } else if (options.fileURL) {
    const progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', style.progress);
    container.appendChild(progressContainer);

    const progressCallback = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percent = Math.floor(
          (100 * progressEvent.loaded) / progressEvent.total
        );
        progressContainer.innerHTML = `Loading ${percent}%`;
      } else {
        progressContainer.innerHTML = macro.formatBytesToProperUnit(
          progressEvent.loaded
        );
      }
    };

    HttpDataAccessHelper.fetchBinary(options.fileURL, {
      progressCallback,
    }).then((binary) => {
      container.removeChild(progressContainer);
      createViewer(container, binary, options);
    });
  }
}

export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${style.bigFileDrop}"/><input type="file" accept=".vti" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      const ext = files[0].name.split('.').slice(-1)[0];
      const options = { file: files[0], ext, ...userParams };
      load(myContainer, options);
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

// Look at URL an see if we should load a file
// ?fileURL=https://data.kitware.com/api/v1/item/59cdbb588d777f31ac63de08/download
if (userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  load(myContainer, userParams);
}

const viewerContainers = document.querySelectorAll('.vtkjs-image-viewer');
let nbViewers = viewerContainers.length;
while (nbViewers--) {
  const viewerContainer = viewerContainers[nbViewers];
  const fileURL = viewerContainer.dataset.url;
  const options = {
    containerStyle: { height: '100%' },
    ...userParams,
    fileURL,
  };
  load(viewerContainer, options);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
