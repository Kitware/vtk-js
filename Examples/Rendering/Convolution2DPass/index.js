import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for WebGL only)
import 'vtk.js/Sources/Rendering/OpenGL/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkConvolution2DPass from 'vtk.js/Sources/Rendering/OpenGL/Convolution2DPass';
import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const view = renderWindow.getViews()[0];

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Utility functions for generating convolution passes
// ----------------------------------------------------------------------------

function getConvolutionPass(kernel, kernelDimension, delegates = null) {
  const convolutionPass = vtkConvolution2DPass.newInstance();
  if (delegates !== null) {
    convolutionPass.setDelegates(delegates);
  }
  convolutionPass.setKernelDimension(kernelDimension);
  convolutionPass.setKernel(kernel);
  return convolutionPass;
}

function getEdgeEnhancement1Pass(k, delegates = null) {
  return getConvolutionPass(
    [0, -k, 0, -k, 1 + 4 * k, -k, 0, -k, 0],
    3,
    delegates
  );
}

function getEdgeEnhancement2Pass(k, delegates = null) {
  return getConvolutionPass(
    [-k, -k, -k, -k, 1 + 8 * k, -k, -k, -k, -k],
    3,
    delegates
  );
}

function getEdgeEnhancement3Pass(k, delegates = null) {
  return getConvolutionPass(
    [-k, -2 * k, -k, -2 * k, 1 + 12 * k, -2 * k, -k, -2 * k, -k],
    3,
    delegates
  );
}

function getGaussianBlurPass(delegates = null) {
  return getConvolutionPass([1, 2, 1, 2, 4, 2, 1, 2, 1], 3, delegates);
}

function getEdgeDetectPass(delegates = null) {
  return getConvolutionPass([-1, -1, -1, -1, 8, -1, -1, -1, -1], 3, delegates);
}

function getUnsharpMaskPass(delegates = null) {
  // prettier-ignore
  return getConvolutionPass(
    [
      -1, -4, -6, -4, -1,
      -4, -16, -24, -16, -4,
      -6, -24, 512 - 36, -24, -6,
      -4, -16, -24, -16, -4,
      -1, -4, -6, -4, -1
    ],
    5,
    delegates
  );
}

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(200.0, 0.4, 0.2, 0.0);
ctfun.addRGBPoint(2000.0, 1.0, 1.0, 1.0);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(200.0, 0.0);
ofun.addPoint(1200.0, 0.5);
ofun.addPoint(3000.0, 0.8);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
actor.getProperty().setInterpolationTypeToLinear();
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

mapper.setInputConnection(reader.getOutputPort());

// ----------------------------------------------------------------------------
// Update render-pipeline with chain of enabled render passes
// ----------------------------------------------------------------------------
function updatePostProcessing(event) {
  let renderPass = vtkForwardPass.newInstance();
  if (document.querySelector('.gaussPass').checked) {
    renderPass = getGaussianBlurPass([renderPass]);
  }
  if (document.querySelector('.edge1Pass').checked) {
    const k = document.querySelector('.edge1PassValue').value;
    renderPass = getEdgeEnhancement1Pass(k, [renderPass]);
  }
  if (document.querySelector('.edge2Pass').checked) {
    const k = document.querySelector('.edge2PassValue').value;
    renderPass = getEdgeEnhancement2Pass(k, [renderPass]);
  }
  if (document.querySelector('.edge3Pass').checked) {
    const k = document.querySelector('.edge3PassValue').value;
    renderPass = getEdgeEnhancement3Pass(k, [renderPass]);
  }
  if (document.querySelector('.edgeDetect').checked) {
    renderPass = getEdgeDetectPass([renderPass]);
  }
  if (document.querySelector('.unsharpMask').checked) {
    renderPass = getUnsharpMaskPass([renderPass]);
  }

  view.setRenderPasses([renderPass]);
  renderWindow.render();
}

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(80);
    renderWindow.render();

    document
      .querySelector('.gaussPass')
      .addEventListener('change', updatePostProcessing);
    document
      .querySelector('.edgeDetect')
      .addEventListener('change', updatePostProcessing);
    document
      .querySelector('.edge1PassValue')
      .addEventListener('input', updatePostProcessing);
    document
      .querySelector('.edge1Pass')
      .addEventListener('change', updatePostProcessing);
    document
      .querySelector('.edge2PassValue')
      .addEventListener('input', updatePostProcessing);
    document
      .querySelector('.edge2Pass')
      .addEventListener('change', updatePostProcessing);
    document
      .querySelector('.edge3PassValue')
      .addEventListener('input', updatePostProcessing);
    document
      .querySelector('.edge3Pass')
      .addEventListener('change', updatePostProcessing);
    document
      .querySelector('.unsharpMask')
      .addEventListener('change', updatePostProcessing);
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
