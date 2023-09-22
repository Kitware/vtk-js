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
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
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
  fileURL = 'https://data.kitware.com/api/v1/item/62b38b37bddec9d0c45366e3/download',
} = vtkURLExtract.extractURLParameters();

HttpDataAccessHelper.fetchBinary(fileURL).then((fileContents) => {
  // Read data
  vtiReader.parseAsArrayBuffer(fileContents);
  // Rotate 90 degrees forward so that default head volume faces camera
  const rotateX = mat4.create();
  mat4.fromRotation(rotateX, vtkMath.radiansFromDegrees(90), [1, 0, 0]);
  reslicer.setResliceAxes(rotateX);

  const data = reslicer.getOutputData(0);

  // Restyle visual appearance
  const sampleDistance =
    0.7 *
    Math.sqrt(
      data
        .getSpacing()
        .map((v) => v * v)
        .reduce((a, b) => a + b, 0)
    );
  mapper.setSampleDistance(sampleDistance / 2);

  ofun.addPoint(-1024.0, 0.0);
  ofun.addPoint(67.4682, 0.0);
  ofun.addPoint(67.469, 0.0);
  ofun.addPoint(85.0, 0.1);
  ofun.addPoint(85.0031, 0.0);
  ofun.addPoint(200.0031, 0.0);
  ofun.addPoint(200.297, 0.626);
  ofun.addPoint(408.297, 0.626);
  ofun.addPoint(3532.0, 0.556);

  ctfun.addRGBPoint(-1024.0, 0.937254, 0.937254, 0.937254);
  ctfun.addRGBPoint(4.0927, 0.709019, 0.337254, 0.262745);
  ctfun.addRGBPoint(98.8057, 0.601372, 0.290196, 0.247058);
  ctfun.addRGBPoint(100.0, 0.881, 0.836078, 0.773333);
  ctfun.addRGBPoint(1000.0, 0.881, 0.836078, 0.773333);
  ctfun.addRGBPoint(3532.0, 0.91, 0.826078, 0.783333);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setInterpolationTypeToLinear();

  // CVR
  actor.getProperty().setShade(true);
  actor.getProperty().setAmbient(0.2);
  actor.getProperty().setDiffuse(1.3);
  actor.getProperty().setSpecular(0.0);
  mapper.setGlobalIlluminationReach(0.1);
  mapper.setVolumetricScatteringBlending(0.5);
  mapper.setVolumeShadowSamplingDistFactor(1.0);
  mapper.setAutoAdjustSampleDistances(false);

  // Set up rendering
  renderer.resetCamera();
  renderWindow.render();

  // Add button to launch AR (default) or VR scene
  let xrSessionType = 0;
  const xrButton = document.createElement('button');
  let enterText = 'XR not available!';
  const exitText = 'Exit XR';
  xrButton.textContent = enterText;
  if (navigator.xr !== undefined && xrRenderWindowHelper.getXrSupported()) {
    navigator.xr.isSessionSupported('immersive-ar').then((arSupported) => {
      if (arSupported) {
        xrSessionType = XrSessionTypes.MobileAR;
        enterText = 'Start AR';
        xrButton.textContent = enterText;
      } else {
        navigator.xr.isSessionSupported('immersive-vr').then((vrSupported) => {
          if (vrSupported) {
            xrSessionType = XrSessionTypes.HmdVR;
            enterText = 'Start VR';
            xrButton.textContent = enterText;
          }
        });
      }
    });
  }
  xrButton.addEventListener('click', () => {
    if (xrButton.textContent === enterText) {
      xrRenderWindowHelper.startXR(xrSessionType);
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
