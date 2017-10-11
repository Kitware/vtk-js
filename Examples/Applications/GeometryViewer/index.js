/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'babel-polyfill';

import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkURLExtract              from 'vtk.js/Sources/Common/Core/URLExtract';

import vtkColorMaps               from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkXMLPolyDataReader       from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';

import { ColorMode, ScalarMode }  from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';


import style from './GeometryViewer.mcss';

let autoInit = true;

// ----------------------------------------------------------------------------
// Handle color presets
// ----------------------------------------------------------------------------

const presetNames = vtkColorMaps.filter(p => p.RGBPoints).filter(p => p.ColorSpace !== 'CIELAB').map(p => p.Name);

function getPreset(name) {
  return vtkColorMaps.find(p => p.Name === name);
}

// ----------------------------------------------------------------------------
// DOM containers for UI control
// ----------------------------------------------------------------------------

const presetSelector = document.createElement('select');
presetSelector.setAttribute('class', style.selector);
presetSelector.innerHTML = presetNames.map(name => `<option value="${name}">${name}</option>`).join('');

const representationSelector = document.createElement('select');
representationSelector.setAttribute('class', style.selector);
representationSelector.innerHTML = ['Points', 'Wireframe', 'Surface', 'Surface with Edge']
  .map((name, idx) => `<option value="${idx < 3 ? idx : 2}:${idx === 3 ? 1 : 0}">${name}</option>`).join('');
representationSelector.value = '2:0';

const colorBySelector = document.createElement('select');
colorBySelector.setAttribute('class', style.selector);

const componentSelector = document.createElement('select');
componentSelector.setAttribute('class', style.selector);
componentSelector.style.display = 'none';

const controlContainer = document.createElement('div');
controlContainer.setAttribute('class', style.control);
controlContainer.appendChild(representationSelector);
controlContainer.appendChild(presetSelector);
controlContainer.appendChild(colorBySelector);
controlContainer.appendChild(componentSelector);

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

export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  renderWindow.getInteractor().setDesiredUpdateRate(25);

  if (options.file) {
    if (options.ext === 'vtp') {
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        const vtpReader = vtkXMLPolyDataReader.newInstance();
        vtpReader.parse(reader.result);

        const lookupTable = vtkColorTransferFunction.newInstance();
        const source = vtpReader.getOutputData(0);
        const mapper = vtkMapper.newInstance({
          interpolateScalarsBeforeMapping: false,
          useLookupTableScalarRange: true,
          lookupTable,
          scalarVisibility: false,
        });
        const actor = vtkActor.newInstance();
        const scalars = source.getPointData().getScalars();
        const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);

        // --------------------------------------------------------------------
        // Color handling
        // --------------------------------------------------------------------

        function applyPreset() {
          const preset = getPreset(presetSelector.value);
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
          const [representation, edgeVisibility] = event.target.value.split(':').map(Number);
          actor.getProperty().set({ representation, edgeVisibility });
          renderWindow.render();
        }
        representationSelector.addEventListener('change', updateRepresentation);

        // --------------------------------------------------------------------
        // ColorBy handling
        // --------------------------------------------------------------------

        const colorByOptions = [{ value: ':', label: 'Solid color' }].concat(
          source.getPointData().getArrays().map(a => ({ label: `(p) ${a.getName()}`, value: `PointData:${a.getName()}` })),
          source.getCellData().getArrays().map(a => ({ label: `(c) ${a.getName()}`, value: `CellData:${a.getName()}` })));
        colorBySelector.innerHTML = colorByOptions.map(({ label, value }) => `<option value="${value}">${label}</option>`).join('');

        function updateColorBy(event) {
          const [location, colorByArrayName] = event.target.value.split(':');
          const interpolateScalarsBeforeMapping = (location === 'PointData');
          let colorMode = ColorMode.DEFAULT;
          let scalarMode = ScalarMode.DEFAULT;
          const colorByArrayComponent = -1;
          const scalarVisibility = (location.length > 0);
          if (scalarVisibility) {
            const activeArray = source[`get${location}`]().getArrayByName(colorByArrayName);
            const newDataRange = activeArray.getRange();
            dataRange[0] = newDataRange[0];
            dataRange[1] = newDataRange[1];
            colorMode = ColorMode.MAP_SCALARS;
            scalarMode = interpolateScalarsBeforeMapping ? ScalarMode.USE_POINT_FIELD_DATA : ScalarMode.USE_CELL_FIELD_DATA;

            const numberOfComponents = activeArray.getNumberOfComponents();
            if (numberOfComponents > 1) {
              // componentSelector.style.display = 'block'; // FIXME the 'colorByArrayComponent' is not yet processed in mapper
              const compOpts = ['Magnitude'];
              while (compOpts.length <= numberOfComponents) {
                compOpts.push(`Component ${compOpts.length}`);
              }
              componentSelector.innerHTML = compOpts.map((t, index) => `<option value="${index - 1}">${t}</option>`).join('');
            } else {
              componentSelector.style.display = 'none';
            }
          }
          mapper.set({
            colorByArrayComponent,
            colorByArrayName,
            colorMode,
            interpolateScalarsBeforeMapping,
            scalarMode,
            scalarVisibility,
          });
          applyPreset();
        }
        colorBySelector.addEventListener('change', updateColorBy);

        function updateColorByComponent(event) {
          mapper.setColorByArrayComponent(Number(event.target.value));
          renderWindow.render();
        }
        componentSelector.addEventListener('change', updateColorByComponent);

        // --------------------------------------------------------------------
        // Pipeline handling
        // --------------------------------------------------------------------

        actor.setMapper(mapper);
        mapper.setInputData(source);
        renderer.addActor(actor);

        // Manage update when lookupTable change
        lookupTable.onModified(() => {
          renderWindow.render();
        });

        // Add UI to web page
        container.appendChild(controlContainer);

        // First render
        renderer.resetCamera();
        renderWindow.render();
      };
      reader.readAsText(options.file);
    } else {
      console.error('Unkown file...');
    }
  }
}

export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  fileSelector.setAttribute('class', style.bigFileDrop);
  myContainer.appendChild(fileSelector);
  myContainer.setAttribute('class', style.fullScreen);

  function handleFile(e) {
    var files = this.files;
    if (files.length === 1) {
      myContainer.removeChild(fileSelector);
      const ext = files[0].name.split('.').slice(-1)[0];
      load(myContainer, { file: files[0], ext });
    }
  }
  fileSelector.onchange = handleFile;
}


// Look at URL an see if we should load a file
// ?fileURL=https://data.kitware.com/api/v1/item/59cdbb588d777f31ac63de08/download
const userParams = vtkURLExtract.extractURLParameters();

if (userParams.url || userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  load(myContainer, userParams);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
