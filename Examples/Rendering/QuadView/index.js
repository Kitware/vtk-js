import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Misc/RenderingAPIs';

import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import macro from '@kitware/vtk.js/macros';
import vtkBoundingBox from '@kitware/vtk.js/Common/DataModel/BoundingBox';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';
import vtkImageResliceMapper from '@kitware/vtk.js/Rendering/Core/ImageResliceMapper';
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkVolumeProperty from '@kitware/vtk.js/Rendering/Core/VolumeProperty';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import vtkLight from '@kitware/vtk.js/Rendering/Core/Light';

// ----------------------------------------------------------------------------
// Show loading progress bar
// ----------------------------------------------------------------------------
const rootBody = document.querySelector('body');
const rootContainer = rootBody;
rootContainer.style.width = '100%';
rootContainer.style.height = '100%';
rootContainer.style.position = 'fixed';
rootContainer.style.zIndex = -1;
rootContainer.style.left = 0;
rootContainer.style.top = 0;

const RENDERERS = [];
const CONTAINERS = [];
const renderWindow = vtkRenderWindow.newInstance();
const renderWindowView = renderWindow.newAPISpecificView();

const fpsMonitor = vtkFPSMonitor.newInstance();
const progressContainer = document.createElement('div');
rootContainer.appendChild(progressContainer);

const iStyle = vtkInteractorStyleImage.newInstance();
// iStyle.setInteractionMode('IMAGE3D');
const tStyle = vtkInteractorStyleTrackballCamera.newInstance();

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

function resizeViewportContainer(view, ren, element) {
  const rect = view.getBoundingClientRect();
  const vp = ren.getViewport();
  // Compensate for the border size
  const border = 5;
  const width = (vp[2] - vp[0]) * rect.width - border;
  const height = (vp[3] - vp[1]) * rect.height - border;
  const x = vp[0] * rect.width;
  const y = vp[1] * rect.height;
  element.style.position = 'absolute';
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.left = `${x}px`;
  element.style.bottom = `${y}px`;
  element.style.border = `solid ${border}px darkcyan`;
}

function applyStyle(view, ren, element) {
  element.classList.add('renderer');
  element.style.margin = '0px';
  element.style.display = 'block';
  element.style.boxSizing = 'border';
  element.style.textAlign = 'center';
  element.style.color = 'gray';
  element.style.borderRadius = '5px';
  resizeViewportContainer(view, ren, element);
  return element;
}

function bindInteractor(interactor, el) {
  // only change the interactor's container if needed
  if (interactor.getContainer() !== el) {
    if (interactor.getContainer()) {
      interactor.unbindEvents();
    }
    if (el) {
      const { id } = el;
      if (id === '3') {
        interactor.setInteractorStyle(tStyle);
      } else {
        interactor.setInteractorStyle(iStyle);
      }
      interactor.bindEvents(el);
    }
  }
}

function resize() {
  // Resize the VTK render window first
  const rect = rootContainer.getBoundingClientRect();
  renderWindowView.setSize(rect.width, rect.height);
  // Resize the viewport containers next
  CONTAINERS.forEach((c) => {
    const { id } = c;
    resizeViewportContainer(rootContainer, RENDERERS[id], c);
  });
  renderWindow.render();
}

new ResizeObserver(resize).observe(rootContainer);

// ----------------------------------------------------------------------------
// Creates the volume view
// ----------------------------------------------------------------------------
function createVolumeView(renderer, source) {
  const volume = vtkVolume.newInstance();
  const mapper = vtkVolumeMapper.newInstance();

  volume.setMapper(mapper);
  mapper.setInputData(source);

  // Add one positional light
  const bounds = volume.getBounds();
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
  mapper.setVolumetricScatteringBlending(0.5);
  mapper.setVolumeShadowSamplingDistFactor(5.0);

  // Set volume properties
  const volProp = vtkVolumeProperty.newInstance();
  volProp.setInterpolationTypeToLinear();
  volume
    .getProperty()
    .setScalarOpacityUnitDistance(
      0,
      vtkBoundingBox.getDiagonalLength(source.getBounds()) /
        Math.max(...source.getDimensions())
    );
  volProp.setGradientOpacityMinimumValue(0, 0);
  const dataArray =
    source.getPointData().getScalars() || source.getPointData().getArrays()[0];
  const dataRange = dataArray.getRange();
  volume
    .getProperty()
    .setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.05);
  volProp.setShade(true);
  volProp.setUseGradientOpacity(0, false);
  volProp.setGradientOpacityMinimumOpacity(0, 0.0);
  volProp.setGradientOpacityMaximumOpacity(0, 1.0);
  volProp.setAmbient(0.0);
  volProp.setDiffuse(2.0);
  volProp.setSpecular(0.0);
  volProp.setSpecularPower(0.0);
  volProp.setUseLabelOutline(false);
  volProp.setLabelOutlineThickness(2);
  volume.setProperty(volProp);
  const cam = renderer.getActiveCamera();
  cam.setPosition(0, 0, 0);
  cam.setFocalPoint(-1, -1, 0);
  cam.setViewUp(0, 0, -1);
  renderer.addVolume(volume);
  return volume;
}

// ----------------------------------------------------------------------------
// Main function that creates the quadview
// ----------------------------------------------------------------------------
function createQuadView(myContainer, fileContents) {
  const rect = myContainer.getBoundingClientRect();
  renderWindowView.setSize(rect.width, rect.height);
  renderWindow.addView(renderWindowView);
  renderWindowView.setContainer(myContainer);

  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setView(renderWindowView);
  interactor.initialize();
  interactor.setInteractorStyle(tStyle);

  // Add the four viewports
  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < 2; ++j) {
      const ren = vtkRenderer.newInstance();
      ren.setViewport(
        (i % 2) * 0.51 + 0.01,
        (j % 2) * 0.51 + 0.01,
        (i % 2) * 0.5 + 0.48,
        (j % 2) * 0.5 + 0.48
      );
      // ren.setBackground(i % 2, j % 2, (i % 2) + 0.5);
      // ren.setBackground(1, 1, 1);
      const container = applyStyle(
        myContainer,
        ren,
        document.createElement('div')
      );
      container.id = RENDERERS.length;
      myContainer.appendChild(container);
      container.addEventListener('pointerenter', () =>
        bindInteractor(interactor, container)
      );
      container.addEventListener('pointerleave', () =>
        bindInteractor(interactor, null)
      );

      renderWindow.addRenderer(ren);
      RENDERERS.push(ren);
      CONTAINERS.push(container);
    }
  }

  // FPS monitor
  const fpsElm = fpsMonitor.getFpsMonitorContainer();
  fpsElm.style.position = 'absolute';
  fpsElm.style.left = '10px';
  fpsElm.style.bottom = '10px';
  fpsElm.style.background = 'rgba(255,255,255,0.5)';
  fpsElm.style.borderRadius = '5px';
  fpsMonitor.setContainer(myContainer);
  fpsMonitor.setRenderWindow(renderWindow);

  // Create the three slicing pipelines
  const amapper = vtkImageResliceMapper.newInstance();
  const cmapper = vtkImageResliceMapper.newInstance();
  const smapper = vtkImageResliceMapper.newInstance();
  const aslicePlane = vtkPlane.newInstance();
  aslicePlane.setNormal(0, 0, 1);
  amapper.setSlicePlane(aslicePlane);
  const cslicePlane = vtkPlane.newInstance();
  cslicePlane.setNormal(0, 1, 0);
  cmapper.setSlicePlane(cslicePlane);
  const sslicePlane = vtkPlane.newInstance();
  sslicePlane.setNormal(1, 0, 0);
  smapper.setSlicePlane(sslicePlane);

  const ctf = vtkColorTransferFunction.newInstance();
  ctf.addRGBPoint(0, 0, 0.25, 0.15);
  ctf.addRGBPoint(600, 0.5, 0.5, 0.5);
  ctf.addRGBPoint(3120, 0.2, 0, 0);
  const pf = vtkPiecewiseFunction.newInstance();
  pf.addPoint(0, 0.0);
  pf.addPoint(100, 0.0);
  pf.addPoint(3120, 1.0);
  const aactor = vtkImageSlice.newInstance();
  aactor.setMapper(amapper);
  aactor.getProperty().setColorWindow(2120);
  aactor.getProperty().setColorLevel(2000);
  aactor.getProperty().setRGBTransferFunction(0, ctf);
  RENDERERS[0].addActor(aactor);
  let cam = RENDERERS[0].getActiveCamera();
  cam.setParallelProjection(true);
  const cactor = vtkImageSlice.newInstance();
  cactor.setMapper(cmapper);
  cactor.getProperty().setColorWindow(3120);
  cactor.getProperty().setColorLevel(100);
  cactor.getProperty().setPiecewiseFunction(pf);
  RENDERERS[1].addActor(cactor);
  cam = RENDERERS[1].getActiveCamera();
  cam.setParallelProjection(true);
  cam.setPosition(0, 0, 0);
  cam.setFocalPoint(0, 1, 0);
  cam.setViewUp(0, 0, -1);
  const sactor = vtkImageSlice.newInstance();
  sactor.setMapper(smapper);
  sactor.getProperty().setColorWindow(3120);
  sactor.getProperty().setColorLevel(1000);
  cam = RENDERERS[2].getActiveCamera();
  cam.setParallelProjection(true);
  cam.setPosition(0, 0, 0);
  cam.setFocalPoint(1, 0, 0);
  cam.setViewUp(0, 0, -1);
  RENDERERS[2].addActor(sactor);

  // Read the data
  const reader = vtkXMLImageDataReader.newInstance();
  reader.parseAsArrayBuffer(fileContents);
  const im = reader.getOutputData();
  const bds = im.extentToBounds(im.getExtent());

  // Pass the data to the mappers
  amapper.setInputData(im);
  aslicePlane.setOrigin(bds[0], bds[2], 0.5 * (bds[5] + bds[4]));
  cslicePlane.setOrigin(bds[0], 0.5 * (bds[3] + bds[2]), bds[4]);
  cmapper.setInputData(im);
  sslicePlane.setOrigin(0.5 * (bds[1] + bds[0]), bds[2], bds[4]);
  smapper.setInputData(im);

  // Create the volume view
  const vol = createVolumeView(RENDERERS[3], im);
  vol.getProperty().setRGBTransferFunction(0, ctf);
  vol.getProperty().setScalarOpacity(0, pf);

  RENDERERS.forEach((r) => r.resetCamera());
  renderWindow.render();
}

// ----------------------------------------------------------------------------
// Main function that creates the quadview
// ----------------------------------------------------------------------------
function createReleaseButton(myContainer) {
  const button = document.createElement('button');
  button.innerText = 'Release Graphics';
  button.style.position = 'absolute';
  button.style.left = '1px';
  button.style.top = '1px';
  button.style.zIndex = 2;
  button.addEventListener('click', () => {
    renderWindowView.releaseGraphicsResources();
  });
  myContainer.appendChild(button);
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
  rootContainer.removeChild(progressContainer);
  createQuadView(rootContainer, binary);
  createReleaseButton(rootContainer);
});
