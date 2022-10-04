import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Volume';

// Load the itk-wasm UMD module dynamically for the example.
// Normally, this will just go in the HTML <head>.
import vtkResourceLoader from 'vtk.js/Sources/IO/Core/ResourceLoader';
// Fetch the data. Other options include `fetch`, axios.
import vtkLiteHttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper';

// To render the result in this example
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkITKHelper from 'vtk.js/Sources/Common/DataModel/ITKHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
actor.setMapper(mapper);

const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(200.0, 0.4, 0.5, 0.0);
ctfun.addRGBPoint(2000.0, 1.0, 1.0, 1.0);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(200.0, 0.0);
ofun.addPoint(120.0, 0.3);
ofun.addPoint(300.0, 0.6);
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

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

async function update() {
  const volumeArrayBuffer = await vtkLiteHttpDataAccessHelper.fetchBinary(
    `https://data.kitware.com/api/v1/file/5d2a36ff877dfcc902fae6d9/download`
  );

  const { image: itkImage, webWorker } = await window.itk.readImageArrayBuffer(
    null,
    volumeArrayBuffer,
    'knee.mha'
  );
  webWorker.terminate();

  const vtkImage = vtkITKHelper.convertItkToVtkImage(itkImage);

  mapper.setInputData(vtkImage);
  renderer.addVolume(actor);
  renderer.resetCamera();
  renderer.getActiveCamera().zoom(1.5);
  renderer.getActiveCamera().elevation(70);
  renderer.updateLightsGeometryToFollowCamera();
  renderWindow.render();
}
update();

// After the itk-wasm UMD script has been loaded, `window.itk` provides the itk-wasm API.
vtkResourceLoader
  .loadScript(
    'https://cdn.jsdelivr.net/npm/itk-wasm@1.0.0-b.8/dist/umd/itk-wasm.js'
  )
  .then(update);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
