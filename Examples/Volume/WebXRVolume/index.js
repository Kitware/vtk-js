import { mat4 } from 'gl-matrix';
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

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
const xrRenderWindowHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
});

// ----------------------------------------------------------------------------
// Set up pipeline objects
// ----------------------------------------------------------------------------

const vtiReader = vtkXMLImageDataReader.newInstance();
const reslicer = vtkImageReslice.newInstance();
const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
reslicer.setInputConnection(vtiReader.getOutputPort());
mapper.setInputConnection(reslicer.getOutputPort());
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
  xrSessionType = null,
  colorPreset = null,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
} = vtkURLExtract.extractURLParameters();

// Validate input parameters
let requestedXrSessionType = xrSessionType;
if (!Object.values(XrSessionTypes).includes(requestedXrSessionType)) {
  console.warn(
    'Could not parse requested XR session type: ',
    requestedXrSessionType
  );
  requestedXrSessionType = null;
}

if (requestedXrSessionType === XrSessionTypes.LookingGlassVR) {
  // Import the Looking Glass WebXR Polyfill override
  // Assumes that the Looking Glass Bridge native application is already running.
  // See https://docs.lookingglassfactory.com/developer-tools/webxr
  import(
    // eslint-disable-next-line import/no-unresolved, import/extensions
    /* webpackIgnore: true */ 'https://unpkg.com/@lookingglass/webxr@0.3.0/dist/@lookingglass/bundle/webxr.js'
  ).then((obj) => {
    // eslint-disable-next-line no-new
    new obj.LookingGlassWebXRPolyfill();
  });
} else if (requestedXrSessionType === null) {
  // Guess the session type based on what XR session(s) the device supports.
  navigator.xr.isSessionSupported('immersive-vr').then((vrSupported) => {
    if (vrSupported) {
      requestedXrSessionType = XrSessionTypes.HmdVr;
    } else {
      navigator.xr.isSessionSupported('immersive-ar').then((arSupported) => {
        requestedXrSessionType = arSupported ? XrSessionTypes.MobileAR : null;
      });
    }
  });
}

HttpDataAccessHelper.fetchBinary(fileURL).then((fileContents) => {
  // Read data
  vtiReader.parseAsArrayBuffer(fileContents);

  const resliceRotation = mat4.create();
  if (rotateX) {
    const rotateXMat = mat4.create();
    mat4.fromRotation(
      rotateXMat,
      vtkMath.radiansFromDegrees(rotateX),
      [1, 0, 0]
    );
    mat4.multiply(resliceRotation, resliceRotation, rotateXMat);
  }
  if (rotateY) {
    const rotateYMat = mat4.create();
    mat4.fromRotation(
      rotateYMat,
      vtkMath.radiansFromDegrees(rotateY),
      [0, 1, 0]
    );
    mat4.multiply(resliceRotation, resliceRotation, rotateYMat);
  }
  if (rotateZ) {
    const rotateZMat = mat4.create();
    mat4.fromRotation(
      rotateZMat,
      vtkMath.radiansFromDegrees(rotateZ),
      [0, 0, 1]
    );
    mat4.multiply(resliceRotation, resliceRotation, rotateZMat);
  }
  reslicer.setResliceAxes(resliceRotation);

  const data = reslicer.getOutputData(0);
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

  // https://github.com/Kitware/VolView/blob/f6b1aaa587d1a80ccd99dd9fbab309c58cde08f7/src/vtk/MedicalColorPresets.json
  if (colorPreset === 'CT-AAA') {
    // Colors adjusted from VolView defaults to reduce apparent oversaturation in AR scenes
    ctfun.addRGBPoint(-3024, 0.0, 0, 0);
    ctfun.addRGBPoint(143, 0.62, 0.36, 0.18);
    ctfun.addRGBPoint(166, 0.68, 0.6, 0.34);
    ctfun.addRGBPoint(214, 0.7, 0.7, 0.7);
    ctfun.addRGBPoint(419, 0.9, 0.84, 0.85);
    ctfun.addRGBPoint(3071, 0.83, 0.66, 1);

    ofun.addPoint(-3024, 0);
    ofun.addPoint(144, 0);
    ofun.addPoint(166, 0.69);
    ofun.addPoint(214, 0.7);
    ofun.addPoint(420, 0.83);
    ofun.addPoint(3071, 0.8);
  } else if (colorPreset === 'CT-Bone') {
    ctfun.addRGBPoint(-3024, 0, 0, 0);
    ctfun.addRGBPoint(-16.4458, 0.729412, 0.254902, 0.301961);
    ctfun.addRGBPoint(641.385, 0.905882, 0.815686, 0.552941);
    ctfun.addRGBPoint(3071.0, 1.0, 1.0, 1.0);

    ofun.addPoint(-3024, 0);
    ofun.addPoint(-16.4458, 0);
    ofun.addPoint(641.385, 0.715686);
    ofun.addPoint(3071, 0.705882);
  } else if (colorPreset === 'CT-Cardiac2') {
    ctfun.addRGBPoint(-3024, 0.0, 0, 0);
    ctfun.addRGBPoint(42, 0.55, 0.25, 0.15);
    ctfun.addRGBPoint(163, 0.92, 0.64, 0.06);
    ctfun.addRGBPoint(278, 1, 0.88, 0.62);
    ctfun.addRGBPoint(1587, 1, 1, 1);
    ctfun.addRGBPoint(3071, 0.83, 0.66, 1);

    ofun.addPoint(-3024, 0);
    ofun.addPoint(43, 0);
    ofun.addPoint(163, 0.42);
    ofun.addPoint(277, 0.78);
    ofun.addPoint(1587, 0.75);
    ofun.addPoint(3071, 0.8);
  } else if (colorPreset === 'CT-Chest-Contrast-Enhanced') {
    ctfun.addRGBPoint(-3024, 0, 0, 0);
    ctfun.addRGBPoint(67.0106, 0.54902, 0.25098, 0.14902);
    ctfun.addRGBPoint(251.105, 0.882353, 0.603922, 0.290196);
    ctfun.addRGBPoint(439.291, 1.0, 0.937033, 0.954531);
    ctfun.addRGBPoint(3071.0, 0.827451, 0.658824, 1.0);

    ofun.addPoint(-3024, 0);
    ofun.addPoint(67.0106, 0);
    ofun.addPoint(251.105, 0.446429);
    ofun.addPoint(439.291, 0.625);
    ofun.addPoint(3071, 0.616071);
  } else {
    // Scale color and opacity transfer functions to data intensity range
    ctfun.addRGBPoint(dataRange[0], 0.0, 0.3, 0.3);
    ctfun.addRGBPoint(dataRange[1], 1.0, 1.0, 1.0);
    ofun.addPoint(dataRange[0], 0.0);
    ofun.addPoint((dataRange[1] - dataRange[0]) / 4, 0.0);
    ofun.addPoint(dataRange[1], 0.5);
  }
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setInterpolationTypeToLinear();

  // Set up rendering
  renderer.resetCamera();
  renderWindow.render();

  // Add button to launch AR (default) or VR scene
  const xrButton = document.createElement('button');
  let enterText = 'XR not available!';
  const exitText = 'Exit XR';
  xrButton.textContent = enterText;
  if (navigator.xr !== undefined && xrRenderWindowHelper.getXrSupported()) {
    enterText =
      requestedXrSessionType === XrSessionTypes.MobileAR
        ? 'Start AR'
        : 'Start VR';
    xrButton.textContent = enterText;
  }
  xrButton.addEventListener('click', () => {
    if (xrButton.textContent === enterText) {
      xrRenderWindowHelper.startXR(requestedXrSessionType);
      xrButton.textContent = exitText;
    } else {
      xrRenderWindowHelper.stopXR();
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
