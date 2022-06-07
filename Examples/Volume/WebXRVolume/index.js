import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';

import './WebXRVolume.module.css';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const background = [0, 0, 0];
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background,
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Set up pipeline objects
// ----------------------------------------------------------------------------

const vtiReader = vtkXMLImageDataReader.newInstance();
const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setInputConnection(vtiReader.getOutputPort());
actor.setMapper(mapper);
renderer.addVolume(actor);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
const ofun = vtkPiecewiseFunction.newInstance();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const {
  fileURL = 'https://data.kitware.com/api/v1/file/59de9dca8d777f31ac641dc2/download',
} = vtkURLExtract.extractURLParameters();

HttpDataAccessHelper.fetchBinary(fileURL).then((fileContents) => {
  // Read data
  vtiReader.parseAsArrayBuffer(fileContents);
  const data = vtiReader.getOutputData(0);
  const dataArray =
    data.getPointData().getScalars() || data.getPointData().getArrays()[0];
  const dataRange = dataArray.getRange();

  // Restyle visual appearance
  const sampleDistance =
    0.7 *
    Math.sqrt(
      data
        .getSpacing()
        .map((v) => v * v)
        .reduce((a, b) => a + b, 0)
    );
  mapper.setSampleDistance(sampleDistance);

  ctfun.addRGBPoint(dataRange[0], 0.0, 0.3, 0.3);
  ctfun.addRGBPoint(dataRange[1], 1.0, 1.0, 1.0);
  ofun.addPoint(dataRange[0], 0.0);
  ofun.addPoint((dataRange[1] - dataRange[0]) / 4, 0.0);
  ofun.addPoint(dataRange[1], 0.5);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setInterpolationTypeToLinear();

  // Set up rendering
  renderer.resetCamera();
  renderWindow.render();

  // Add button to launch AR (default) or VR scene
  const VR = 1;
  const AR = 2;
  let xrSessionType = 0;
  const xrButton = document.createElement('button');
  let enterText = 'XR not available!';
  const exitText = 'Exit XR';
  xrButton.textContent = enterText;
  if (
    navigator.xr !== undefined &&
    fullScreenRenderer.getApiSpecificRenderWindow().getXrSupported()
  ) {
    navigator.xr.isSessionSupported('immersive-ar').then((arSupported) => {
      if (arSupported) {
        xrSessionType = AR;
        enterText = 'Start AR';
        xrButton.textContent = enterText;
      } else {
        navigator.xr.isSessionSupported('immersive-vr').then((vrSupported) => {
          if (vrSupported) {
            xrSessionType = VR;
            enterText = 'Start VR';
            xrButton.textContent = enterText;
          }
        });
      }
    });
  }
  xrButton.addEventListener('click', () => {
    if (xrButton.textContent === enterText) {
      if (xrSessionType === AR) {
        fullScreenRenderer.setBackground([0, 0, 0, 0]);
      }
      fullScreenRenderer
        .getApiSpecificRenderWindow()
        .startXR(xrSessionType === AR);
      xrButton.textContent = exitText;
    } else {
      fullScreenRenderer.setBackground([...background, 255]);
      fullScreenRenderer
        .getApiSpecificRenderWindow()
        .stopXR(xrSessionType === AR);
      xrButton.textContent = enterText;
    }
  });
  document.querySelector('.content').appendChild(xrButton);
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = vtiReader;
global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
