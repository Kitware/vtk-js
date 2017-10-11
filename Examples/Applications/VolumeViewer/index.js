/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'babel-polyfill';

import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkURLExtract              from 'vtk.js/Sources/Common/Core/URLExtract';

import vtkColorMaps               from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkXMLImageDataReader      from 'vtk.js/Sources/IO/XML/XMLImageDataReader';

import style from './VolumeViewer.mcss';

let autoInit = true;

// ----------------------------------------------------------------------------
// Handle color presets
// ----------------------------------------------------------------------------

const presetNames = vtkColorMaps.filter(p => p.RGBPoints).map(p => p.Name);

function getPreset(name) {
  return vtkColorMaps.find(p => p.Name === name);
}

// ----------------------------------------------------------------------------
// DOM containers for UI control
// ----------------------------------------------------------------------------

const presetSelector = document.createElement('select');
presetSelector.setAttribute('class', style.selector);
presetSelector.innerHTML = presetNames.map(name => `<option value="${name}">${name}</option>`).join('');

const widgetContainer = document.createElement('div');
widgetContainer.setAttribute('class', style.piecewiseWidget);

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
    if (options.ext === 'vti') {
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        const vtiReader = vtkXMLImageDataReader.newInstance();
        vtiReader.parse(reader.result);

        const source = vtiReader.getOutputData(0);
        const mapper = vtkVolumeMapper.newInstance();
        const actor = vtkVolume.newInstance();

        const dataArray = source.getPointData().getScalars();

        // Color handling
        const lookupTable = vtkColorTransferFunction.newInstance();
        function applyPreset() {
          const preset = getPreset(presetSelector.value);
          lookupTable.applyColorMap(preset);
          lookupTable.setMappingRange(...dataArray.getRange());
          lookupTable.updateRange();
        }
        applyPreset();
        presetSelector.addEventListener('change', applyPreset);

        // Opacity handling
        const piecewiseFunction = vtkPiecewiseFunction.newInstance();

        // Pipeline handling
        actor.setMapper(mapper);
        mapper.setInputData(source);
        renderer.addActor(actor);

        // Configuration
        const sampleDistance = Math.min(...source.getSpacing());
        mapper.setSampleDistance(sampleDistance);
        actor.getProperty().setRGBTransferFunction(0, lookupTable);
        actor.getProperty().setScalarOpacity(0, piecewiseFunction);
        actor.getProperty().setInterpolationTypeToFastLinear();

        actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
        actor.getProperty().setUseGradientOpacity(0, true);
        actor.getProperty().setGradientOpacityMinimumValue(0, 15);
        actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
        actor.getProperty().setGradientOpacityMaximumValue(0, 100);
        actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
        actor.getProperty().setShade(true);
        actor.getProperty().setAmbient(0.2);
        actor.getProperty().setDiffuse(0.7);
        actor.getProperty().setSpecular(0.3);
        actor.getProperty().setSpecularPower(8.0);

        // Control UI
        const transferFunctionWidget = vtkPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [400, 150] });
        transferFunctionWidget.updateStyle({
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          histogramColor: 'rgba(100, 100, 100, 0.5)',
          strokeColor: 'rgb(0, 0, 0)',
          activeColor: 'rgb(255, 255, 255)',
          handleColor: 'rgb(50, 150, 50)',
          buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
          buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
          buttonStrokeColor: 'rgba(0, 0, 0, 1)',
          buttonFillColor: 'rgba(255, 255, 255, 1)',
          strokeWidth: 2,
          activeStrokeWidth: 3,
          buttonStrokeWidth: 1.5,
          handleWidth: 3,
          iconSize: 20,
          padding: 10,
        });
        transferFunctionWidget.addGaussian(0.5, 0.30, 0.5, 0.5, 0.4);
        transferFunctionWidget.setDataArray(dataArray.getData());
        transferFunctionWidget.setColorTransferFunction(lookupTable);
        transferFunctionWidget.applyOpacity(piecewiseFunction);
        transferFunctionWidget.setContainer(widgetContainer);
        transferFunctionWidget.bindMouseListeners();

        // Manage update when opacity change
        transferFunctionWidget.onAnimation((start) => {
          if (start) {
            renderWindow.getInteractor().requestAnimation(transferFunctionWidget);
          } else {
            renderWindow.getInteractor().cancelAnimation(transferFunctionWidget);
          }
        });
        transferFunctionWidget.onOpacityChange(() => {
          transferFunctionWidget.applyOpacity(piecewiseFunction);
          if (!renderWindow.getInteractor().isAnimating()) {
            renderWindow.render();
          }
        });

        // Manage update when lookupTable change
        lookupTable.onModified(() => {
          transferFunctionWidget.render();
          if (!renderWindow.getInteractor().isAnimating()) {
            renderWindow.render();
          }
        });

        // Add UI to web page
        container.appendChild(widgetContainer);
        container.appendChild(presetSelector);

        // First render
        renderer.resetCamera();
        renderWindow.render();
      };
      reader.readAsText(options.file);
    } else {
      alert('Unkown file...');
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
