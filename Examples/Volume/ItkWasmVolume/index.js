import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Fetch the data. Other options include `fetch`, axios.
import vtkLiteHttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper';

// To render the result in this example
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkITKHelper from '@kitware/vtk.js/Common/DataModel/ITKHelper';

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

  // Load the itk-wasm ESM module dynamically for the example.
  // This can also go in the HTML <head>.
  // Or `npm install @itk-wasm/image-io` and import it directly.
  const { readImage } = await import(
    // eslint-disable-next-line import/no-unresolved, import/extensions
    /* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@itk-wasm/image-io@1.1.0/dist/bundle/index-worker-embedded.min.js'
  );

  const { image: itkImage, webWorker } = await readImage({
    data: new Uint8Array(volumeArrayBuffer),
    path: 'knee.mha',
  });
  // Optionally terminate the web worker when it is no longer needed
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
