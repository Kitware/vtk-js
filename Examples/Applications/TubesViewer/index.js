/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';
import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import { VaryRadius } from 'vtk.js/Sources/Filters/General/TubeFilter/Constants';

import style from './TubesViewer.module.css';
import icon from '../../../Documentation/content/icon/favicon-96x96.png';

let autoInit = true;
let background = [0, 0, 0];
let renderWindow;
let renderer;

global.pipeline = {};

// Process arguments from URL
const userParams = vtkURLExtract.extractURLParameters();

// Background handling
if (userParams.background) {
  background = userParams.background.split(',').map((s) => Number(s));
}
const selectorClass =
  background.length === 3 && background.reduce((a, b) => a + b, 0) < 1.5
    ? style.dark
    : style.light;

// name
const defaultName = userParams.name || '';

// lut
const lutName = userParams.lut || 'erdc_rainbow_bright';

// field
const field = userParams.field || '';

// camera
function updateCamera(camera) {
  ['zoom', 'pitch', 'elevation', 'yaw', 'azimuth', 'roll', 'dolly'].forEach(
    (key) => {
      if (userParams[key]) {
        camera[key](userParams[key]);
      }
      renderWindow.render();
    }
  );
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

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

// ----------------------------------------------------------------------------
// Add class to body if iOS device
// ----------------------------------------------------------------------------

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

function createViewer(container) {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background,
    rootContainer: container,
    containerStyle: { height: '100%', width: '100%', position: 'absolute' },
  });
  renderer = fullScreenRenderer.getRenderer();
  renderWindow = fullScreenRenderer.getRenderWindow();
  renderWindow.getInteractor().setDesiredUpdateRate(15);

  container.appendChild(rootControllerContainer);
  container.appendChild(addDataSetButton);
}

// ----------------------------------------------------------------------------

function createPipeline(fileName, fileContents) {
  // Create UI
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

  const representationSelector = document.createElement('select');
  representationSelector.setAttribute('class', selectorClass);
  representationSelector.innerHTML = [
    'Hidden',
    'Points',
    'Wireframe',
    'Surface',
    'Surface with Edge',
  ]
    .map(
      (name, idx) =>
        `<option value="${idx === 0 ? 0 : 1}:${idx < 4 ? idx - 1 : 2}:${
          idx === 4 ? 1 : 0
        }">${name}</option>`
    )
    .join('');
  representationSelector.value = '1:2:0';

  const colorBySelector = document.createElement('select');
  colorBySelector.setAttribute('class', selectorClass);

  const componentSelector = document.createElement('select');
  componentSelector.setAttribute('class', selectorClass);
  componentSelector.style.display = 'none';

  const opacitySelector = document.createElement('input');
  opacitySelector.setAttribute('class', selectorClass);
  opacitySelector.setAttribute('type', 'range');
  opacitySelector.setAttribute('value', '100');
  opacitySelector.setAttribute('max', '100');
  opacitySelector.setAttribute('min', '1');

  const tubingRLabel = document.createElement('label');
  tubingRLabel.setAttribute('class', selectorClass);
  tubingRLabel.innerHTML = 'Radius';
  const radiusSelector = document.createElement('input');
  radiusSelector.setAttribute('class', selectorClass);
  radiusSelector.setAttribute('type', 'range');
  radiusSelector.setAttribute('value', '5');
  radiusSelector.setAttribute('max', '100');
  radiusSelector.setAttribute('min', '1');

  const tubingnSLabel = document.createElement('label');
  tubingnSLabel.setAttribute('class', selectorClass);
  tubingnSLabel.innerHTML = 'No. of Sides';
  const nsidesSelector = document.createElement('input');
  nsidesSelector.setAttribute('class', selectorClass);
  nsidesSelector.setAttribute('type', 'range');
  nsidesSelector.setAttribute('value', '20');
  nsidesSelector.setAttribute('max', '100');
  nsidesSelector.setAttribute('min', '3');

  const tubingCLabel = document.createElement('label');
  tubingCLabel.setAttribute('class', selectorClass);
  tubingCLabel.innerHTML = 'Capping';
  const cappingSelector = document.createElement('input');
  cappingSelector.setAttribute('class', 'checkbox');
  cappingSelector.setAttribute('type', 'checkbox');
  cappingSelector.setAttribute('checked', 'true');

  const tubingoRLabel = document.createElement('label');
  tubingoRLabel.setAttribute('class', selectorClass);
  tubingoRLabel.innerHTML = 'On Ratio';
  const onRatioSelector = document.createElement('input');
  onRatioSelector.setAttribute('type', 'number');
  onRatioSelector.setAttribute('value', '1');
  onRatioSelector.setAttribute('max', '6');
  onRatioSelector.setAttribute('min', '1');

  const labelSelector = document.createElement('label');
  labelSelector.setAttribute('class', selectorClass);
  labelSelector.innerHTML = fileName;

  const tubeCheckBox = document.createElement('input');
  tubeCheckBox.setAttribute('class', 'checkbox');
  tubeCheckBox.setAttribute('type', 'checkbox');
  tubeCheckBox.setAttribute('checked', true);

  const tubingLabel = document.createElement('label');
  tubingLabel.setAttribute('class', selectorClass);
  tubingLabel.innerHTML = 'Tubing';

  const controlContainer = document.createElement('div');
  controlContainer.setAttribute('class', style.control);
  controlContainer.appendChild(labelSelector);
  controlContainer.appendChild(representationSelector);
  controlContainer.appendChild(presetSelector);
  controlContainer.appendChild(colorBySelector);
  controlContainer.appendChild(componentSelector);
  controlContainer.appendChild(opacitySelector);
  controlContainer.appendChild(tubingLabel);
  controlContainer.appendChild(tubeCheckBox);
  rootControllerContainer.appendChild(controlContainer);

  const tubeControlContainer = document.createElement('div');
  tubeControlContainer.setAttribute('class', style.control);
  tubeControlContainer.appendChild(tubingRLabel);
  tubeControlContainer.appendChild(radiusSelector);
  tubeControlContainer.appendChild(tubingnSLabel);
  tubeControlContainer.appendChild(nsidesSelector);
  tubeControlContainer.appendChild(tubingoRLabel);
  tubeControlContainer.appendChild(onRatioSelector);
  tubeControlContainer.appendChild(tubingCLabel);
  tubeControlContainer.appendChild(cappingSelector);
  rootControllerContainer.appendChild(tubeControlContainer);

  // VTK pipeline
  const vtpReader = vtkXMLPolyDataReader.newInstance();
  vtpReader.parseAsArrayBuffer(fileContents);

  const tubeFilter = vtkTubeFilter.newInstance();
  tubeFilter.setRadius(0.05);
  tubeFilter.setCapping(true);
  tubeFilter.setNumberOfSides(20);
  tubeFilter.setInputConnection(vtpReader.getOutputPort());
  tubeFilter.setInputArrayToProcess(0, 'Radius', 'PointData', 'Scalars');
  tubeFilter.setVaryRadius(VaryRadius.VARY_RADIUS_BY_SCALAR);

  const lookupTable = vtkColorTransferFunction.newInstance();
  // const source = tubeFilter.getOutputData(0);
  const mapper = vtkMapper.newInstance({
    interpolateScalarsBeforeMapping: false,
    useLookupTableScalarRange: true,
    lookupTable,
    scalarVisibility: false,
  });
  const tubeMapper = vtkMapper.newInstance({
    interpolateScalarsBeforeMapping: false,
    useLookupTableScalarRange: true,
    lookupTable,
    scalarVisibility: false,
  });
  const actor = vtkActor.newInstance();
  const tubeActor = vtkActor.newInstance();
  const scalars = tubeFilter.getOutputData().getPointData().getScalars();
  const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);

  // --------------------------------------------------------------------
  // Color handling
  // --------------------------------------------------------------------

  function applyPreset() {
    const preset = vtkColorMaps.getPresetByName(presetSelector.value);
    lookupTable.applyColorMap(preset);
    lookupTable.setMappingRange(dataRange[0], dataRange[1]);
    lookupTable.updateRange();
  }
  applyPreset();
  presetSelector.addEventListener('change', applyPreset);

  // --------------------------------------------------------------------
  // Representation handling
  // --------------------------------------------------------------------

  function updateRepresentation(event) {
    const [visibility, representation, edgeVisibility] = event.target.value
      .split(':')
      .map(Number);
    tubeActor.getProperty().set({ representation, edgeVisibility });
    tubeActor.setVisibility(!!visibility);
    renderWindow.render();
  }
  representationSelector.addEventListener('change', updateRepresentation);

  // --------------------------------------------------------------------
  // Opacity handling
  // --------------------------------------------------------------------

  function updateOpacity(event) {
    const opacity = Number(event.target.value) / 100;
    actor.getProperty().setOpacity(opacity);
    tubeActor.getProperty().setOpacity(opacity);
    renderWindow.render();
  }

  opacitySelector.addEventListener('input', updateOpacity);

  // --------------------------------------------------------------------
  // ColorBy handling
  // --------------------------------------------------------------------

  const colorByOptions = [{ value: ':', label: 'Solid color' }].concat(
    tubeFilter
      .getOutputData()
      .getPointData()
      .getArrays()
      .map((a) => ({
        label: `(p) ${a.getName()}`,
        value: `PointData:${a.getName()}`,
      })),
    tubeFilter
      .getOutputData()
      .getCellData()
      .getArrays()
      .map((a) => ({
        label: `(c) ${a.getName()}`,
        value: `CellData:${a.getName()}`,
      }))
  );
  colorBySelector.innerHTML = colorByOptions
    .map(
      ({ label, value }) =>
        `<option value="${value}" ${
          field === value ? 'selected="selected"' : ''
        }>${label}</option>`
    )
    .join('');

  function updateColorBy(event) {
    const [location, colorByArrayName] = event.target.value.split(':');
    const interpolateScalarsBeforeMapping = location === 'PointData';
    let colorMode = ColorMode.DEFAULT;
    let scalarMode = ScalarMode.DEFAULT;
    const scalarVisibility = location.length > 0;
    if (scalarVisibility) {
      const activeArray = tubeFilter
        .getOutputData()
        [`get${location}`]()
        .getArrayByName(colorByArrayName);
      const newDataRange = activeArray.getRange();
      dataRange[0] = newDataRange[0];
      dataRange[1] = newDataRange[1];
      colorMode = ColorMode.MAP_SCALARS;
      scalarMode =
        location === 'PointData'
          ? ScalarMode.USE_POINT_FIELD_DATA
          : ScalarMode.USE_CELL_FIELD_DATA;

      const numberOfComponents = activeArray.getNumberOfComponents();
      if (numberOfComponents > 1) {
        // always start on magnitude setting
        if (tubeMapper.getLookupTable()) {
          const lut = tubeMapper.getLookupTable();
          lut.setVectorModeToMagnitude();
        }
        componentSelector.style.display = 'block';
        const compOpts = ['Magnitude'];
        while (compOpts.length <= numberOfComponents) {
          compOpts.push(`Component ${compOpts.length}`);
        }
        componentSelector.innerHTML = compOpts
          .map((t, index) => `<option value="${index - 1}">${t}</option>`)
          .join('');
      } else {
        componentSelector.style.display = 'none';
      }
    } else {
      componentSelector.style.display = 'none';
    }
    mapper.set({
      colorByArrayName,
      colorMode,
      interpolateScalarsBeforeMapping,
      scalarMode,
      scalarVisibility,
    });
    tubeMapper.set({
      colorByArrayName,
      colorMode,
      interpolateScalarsBeforeMapping,
      scalarMode,
      scalarVisibility,
    });
    applyPreset();
  }
  colorBySelector.addEventListener('change', updateColorBy);
  updateColorBy({ target: colorBySelector });

  function updateColorByComponent(event) {
    if (tubeMapper.getLookupTable()) {
      const tubeLut = tubeMapper.getLookupTable();
      if (event.target.value === -1) {
        tubeLut.setVectorModeToMagnitude();
      } else {
        tubeLut.setVectorModeToComponent();
        tubeLut.setVectorComponent(Number(event.target.value));
      }
      renderWindow.render();
    }
  }
  componentSelector.addEventListener('change', updateColorByComponent);

  // --------------------------------------------------------------------
  // Tube handling
  // --------------------------------------------------------------------
  function showTubingControl(event) {
    const check = event.target.checked;
    if (check) {
      tubeControlContainer.style.display = 'block';
      tubeActor.setVisibility(true);
    } else {
      tubeControlContainer.style.display = 'none';
      tubeActor.setVisibility(false);
    }
    renderWindow.render();
  }

  tubeCheckBox.addEventListener('change', showTubingControl);

  function updateTubeRadius(event) {
    const radius = Number(event.target.value) / 100;
    tubeFilter.setRadius(radius);
    renderWindow.render();
  }

  radiusSelector.addEventListener('input', updateTubeRadius);

  function updateTubeNumberOfSides(event) {
    const nSides = Number(event.target.value);
    tubeFilter.setNumberOfSides(nSides);
    renderWindow.render();
  }

  nsidesSelector.addEventListener('input', updateTubeNumberOfSides);

  function updateTubeOnRatio(event) {
    const onRatio = Number(event.target.value);
    tubeFilter.setOnRatio(onRatio);
    renderWindow.render();
  }

  onRatioSelector.addEventListener('input', updateTubeOnRatio);

  function updateTubeCapping(event) {
    const checked = event.target.checked;
    tubeFilter.setCapping(checked);
    renderWindow.render();
  }

  cappingSelector.addEventListener('change', updateTubeCapping);

  // --------------------------------------------------------------------
  // Pipeline handling
  // --------------------------------------------------------------------

  tubeActor.setMapper(tubeMapper);
  tubeMapper.setInputConnection(tubeFilter.getOutputPort());
  renderer.addActor(tubeActor);
  actor.setMapper(mapper);
  mapper.setInputConnection(vtpReader.getOutputPort());
  renderer.addActor(actor);

  // Manage update when lookupTable change
  lookupTable.onModified(() => {
    renderWindow.render();
  });

  // First render
  renderer.resetCamera();
  renderWindow.render();

  global.pipeline[fileName] = {
    actor,
    tubeActor,
    tubeFilter,
    tubeMapper,
    mapper,
    lookupTable,
    renderer,
    renderWindow,
    vtpReader,
  };
}

// ----------------------------------------------------------------------------

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = function onLoad(e) {
    createPipeline(file.name, reader.result);
  };
  reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------------------------------

export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  if (options.files) {
    createViewer(container);
    let count = options.files.length;
    while (count--) {
      loadFile(options.files[count]);
    }
    updateCamera(renderer.getActiveCamera());
  } else if (options.fileURL) {
    const progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', style.progress);
    container.appendChild(progressContainer);

    const progressCallback = (progressEvent) => {
      const percent = Math.floor(
        (100 * progressEvent.loaded) / progressEvent.total
      );
      progressContainer.innerHTML = `Loading ${percent}%`;
    };

    HttpDataAccessHelper.fetchBinary(options.fileURL, {
      progressCallback,
    }).then((binary) => {
      container.removeChild(progressContainer);
      createViewer(container);
      createPipeline(defaultName, binary);
      updateCamera(renderer.getActiveCamera());
    });
  }
}

export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  if (myContainer !== container) {
    myContainer.classList.add(style.fullScreen);
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  } else {
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  }

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${style.bigFileDrop}"/><input type="file" multiple accept=".vtp" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length > 0) {
      myContainer.removeChild(fileContainer);
      load(myContainer, { files });
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

// Look at URL an see if we should load a file
// ?fileURL=https://data.kitware.com/api/v1/item/59cdbb588d777f31ac63de08/download
if (userParams.url || userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;

  if (myContainer) {
    myContainer.classList.add(style.fullScreen);
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  }

  load(myContainer, userParams);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
