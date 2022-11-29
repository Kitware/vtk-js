import '@kitware/vtk.js/favicon';

import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import macro from '@kitware/vtk.js/macros';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkLight from '@kitware/vtk.js/Rendering/Core/Light';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkVolumeController from '@kitware/vtk.js/Interaction/UI/VolumeController';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox';
import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Show loading progress bar
// ----------------------------------------------------------------------------
const rootBody = document.querySelector('body');
const myContainer = rootBody;

const fpsMonitor = vtkFPSMonitor.newInstance();
const progressContainer = document.createElement('div');
myContainer.appendChild(progressContainer);

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

// ----------------------------------------------------------------------------
// Main function to set up and render volume
// ----------------------------------------------------------------------------
function createVolumeShadowViewer(rootContainer, fileContents) {
  // Container content and style
  const background = [0, 0, 0];
  const containerStyle = { height: '100%', width: '100%' };
  const controlPanelStyle = {
    position: 'absolute',
    left: '5px',
    top: '210px',
    backgroundColor: 'white',
    borderRadius: '5px',
    listStyle: 'none',
    padding: '5px 10px',
    margin: '0',
    display: 'block',
    border: 'solid 1px black',
    maxWidth: 'calc(100% - 70px)',
    maxHeight: 'calc(100% - 60px)',
    overflow: 'auto',
  };
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background,
    containerStyle,
    rootContainer,
    controlPanelStyle,
  });
  fullScreenRenderer.addController(controlPanel);

  const renderer = fullScreenRenderer.getRenderer();
  renderer.setTwoSidedLighting(false);
  const renderWindow = fullScreenRenderer.getRenderWindow();

  // FPS monitor
  const fpsElm = fpsMonitor.getFpsMonitorContainer();
  fpsElm.style.position = 'absolute';
  fpsElm.style.left = '10px';
  fpsElm.style.bottom = '10px';
  fpsElm.style.background = 'rgba(255,255,255,0.5)';
  fpsElm.style.borderRadius = '5px';
  fpsMonitor.setContainer(rootContainer);
  fpsMonitor.setRenderWindow(renderWindow);

  // Actor and mapper pipeline
  const vtiReader = vtkXMLImageDataReader.newInstance();
  vtiReader.parseAsArrayBuffer(fileContents);
  const source = vtiReader.getOutputData(0);

  const actor = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();

  actor.setMapper(mapper);
  mapper.setInputData(source);

  // Add one positional light
  const bounds = actor.getBounds();
  const center = [
    (bounds[1] - bounds[0]) / 2.0,
    (bounds[3] - bounds[2]) / 2.0,
    (bounds[5] - bounds[4]) / 2.0,
  ];
  renderer.removeAllLights();
  const light = vtkLight.newInstance();
  const lightPos = [center[0] + 300, center[1] + 50, center[2] - 50];
  light.setPositional(true);
  light.setLightType('SceneLight');
  light.setPosition(lightPos);
  light.setFocalPoint(center);
  light.setColor(1, 1, 1);
  light.setIntensity(1.0);
  light.setConeAngle(50.0);
  renderer.addLight(light);

  // Set up sample distance and initialize volume shadow related paramters
  const sampleDistance =
    0.7 *
    Math.sqrt(
      source
        .getSpacing()
        .map((v) => v * v)
        .reduce((a, b) => a + b, 0)
    );
  mapper.setSampleDistance(sampleDistance / 2.5);
  mapper.setComputeNormalFromOpacity(false);
  mapper.setGlobalIlluminationReach(0.0);
  mapper.setVolumetricScatteringBlending(0.0);
  mapper.setVolumeShadowSamplingDistFactor(5.0);

  // Add transfer function
  const lookupTable = vtkColorTransferFunction.newInstance();
  const piecewiseFunction = vtkPiecewiseFunction.newInstance();
  actor.getProperty().setRGBTransferFunction(0, lookupTable);
  actor.getProperty().setScalarOpacity(0, piecewiseFunction);

  // Set actor properties
  actor.getProperty().setInterpolationTypeToLinear();
  actor
    .getProperty()
    .setScalarOpacityUnitDistance(
      0,
      vtkBoundingBox.getDiagonalLength(source.getBounds()) /
        Math.max(...source.getDimensions())
    );
  actor.getProperty().setGradientOpacityMinimumValue(0, 0);
  const dataArray =
    source.getPointData().getScalars() || source.getPointData().getArrays()[0];
  const dataRange = dataArray.getRange();
  actor
    .getProperty()
    .setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.05);
  actor.getProperty().setShade(true);
  actor.getProperty().setUseGradientOpacity(0, false);
  actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  actor.getProperty().setAmbient(0.0);
  actor.getProperty().setDiffuse(2.0);
  actor.getProperty().setSpecular(0.0);
  actor.getProperty().setSpecularPower(0.0);
  actor.getProperty().setUseLabelOutline(false);
  actor.getProperty().setLabelOutlineThickness(2);
  renderer.addActor(actor);

  // Control UI for sample distance, transfer function, and shadow on/off
  const controllerWidget = vtkVolumeController.newInstance({
    size: [400, 150],
    rescaleColorMap: true,
  });
  const isBackgroundDark = background[0] + background[1] + background[2] < 1.5;
  const useShadow = 1;
  controllerWidget.setContainer(rootContainer);
  controllerWidget.setupContent(
    renderWindow,
    actor,
    isBackgroundDark,
    useShadow
  );

  fullScreenRenderer.setResizeCallback(({ width, _height }) => {
    if (width > 414) {
      controllerWidget.setSize(400, 150);
    } else {
      controllerWidget.setSize(width - 14, 150);
    }
    controllerWidget.render();
    fpsMonitor.update();
  });

  // Add sliders to tune volume shadow effect
  function updateVSB(e) {
    const vsb = Number(e.target.value);
    mapper.setVolumetricScatteringBlending(vsb);
    renderWindow.render();
  }
  function updateGlobalReach(e) {
    const gir = Number(e.target.value);
    mapper.setGlobalIlluminationReach(gir);
    renderWindow.render();
  }
  function updateSD(e) {
    const sd = Number(e.target.value);
    mapper.setVolumeShadowSamplingDistFactor(sd);
    renderWindow.render();
  }
  function updateAT(e) {
    const at = Number(e.target.value);
    mapper.setAnisotropy(at);
    renderWindow.render();
  }
  const el = document.querySelector('.volumeBlending');
  el.setAttribute('min', 0);
  el.setAttribute('max', 1);
  el.setAttribute('value', 0.0);
  el.addEventListener('input', updateVSB);
  const gr = document.querySelector('.globalReach');
  gr.setAttribute('min', 0);
  gr.setAttribute('max', 1);
  gr.setAttribute('value', 0);
  gr.addEventListener('input', updateGlobalReach);
  const sd = document.querySelector('.samplingDist');
  sd.setAttribute('min', 1);
  sd.setAttribute('max', 10);
  sd.setAttribute('value', 5);
  sd.addEventListener('input', updateSD);
  const at = document.querySelector('.anisotropy');
  at.setAttribute('min', -1.0);
  at.setAttribute('max', 1.0);
  at.setAttribute('value', 0.0);
  at.addEventListener('input', updateAT);

  // Add toggle for density gradient versus scalar gradient
  let isDensity = false;
  const buttonID = document.querySelector('.text2');
  function toggleDensityNormal() {
    isDensity = !isDensity;
    mapper.setComputeNormalFromOpacity(isDensity);
    buttonID.innerText = `(${isDensity ? 'on' : 'off'})`;
    renderWindow.render();
  }

  // Render a sphere to represent light position, if light is positional
  if (light.getPositional()) {
    const sphereSource = vtkSphereSource.newInstance();
    const actorSphere = vtkActor.newInstance({
      position: lightPos,
      scale: [2, 2, 2],
    });
    const mapperSphere = vtkMapper.newInstance();
    mapperSphere.setInputConnection(sphereSource.getOutputPort());

    actorSphere.getProperty().setColor([1, 0, 0]);
    actorSphere.getProperty().setLighting(false);
    actorSphere.setMapper(mapperSphere);
    actorSphere.setUseBounds(false);
    renderer.addActor(actorSphere);
  }

  // Camera and first render
  renderer.resetCamera();
  renderWindow.render();

  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  global.source = vtiReader;
  global.mapper = mapper;
  global.actor = actor;
  global.renderer = renderer;
  global.renderWindow = renderWindow;
  global.toggleDensityNormal = toggleDensityNormal;
  global.updateVSB = updateVSB;
  global.updateAT = updateAT;
  global.updateGlobalReach = updateGlobalReach;
  global.updateSD = updateSD;
}

// ----------------------------------------------------------------------------
// Read volume and render
// ----------------------------------------------------------------------------
HttpDataAccessHelper.fetchBinary(
  'https://data.kitware.com/api/v1/item/59de9dc98d777f31ac641dc1/download',
  {
    progressCallback,
  }
).then((binary) => {
  myContainer.removeChild(progressContainer);
  createVolumeShadowViewer(myContainer, binary);
});
