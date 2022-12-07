import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';

// import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.3],
});

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

// SETUP ================
// Load script from https://unpkg.com/vtk.js then...

const clipPlane1 = vtkPlane.newInstance();
const clipPlane2 = vtkPlane.newInstance();
let clipPlane1Position = 0;
let clipPlane2Position = 0;
const clipPlane1Normal = [-1, 1, 0];
const clipPlane2Normal = [0, 0, 1];

function getSphereActor({
  center,
  radius,
  phiResolution,
  thetaResolution,
  opacity,
}) {
  const sphereSource = vtkSphereSource.newInstance({
    center,
    radius,
    phiResolution,
    thetaResolution,
  });
  sphereSource.setCenter(center);

  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();

  actor.getProperty().setOpacity(opacity);

  mapper.setInputConnection(sphereSource.getOutputPort());
  actor.setMapper(mapper);

  const polyData = sphereSource.getOutputData();
  const data = polyData.getPoints().getData();

  return { actor, data, mapper };
}

const { actor: cubeActor, mapper: sphereMapper } = getSphereActor({
  center: [125, 125, 200],
  radius: 50,
  phiResolution: 30,
  thetaResolution: 30,
  opacity: 1,
  edgeVisibility: true,
});

cubeActor.setMapper(sphereMapper);

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance({
  sampleDistance: 1.1,
});

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

renderer.addActor(cubeActor);

const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

const reader = vtkHttpDataSetReader.newInstance({
  fetchGzip: true,
});

actor.setMapper(mapper);
mapper.setInputConnection(reader.getOutputPort());

reader
  .setUrl('https://kitware.github.io/vtk-js/data/volume/LIDC2.vti')
  .then(() => {
    reader.loadData().then(() => {
      const data = reader.getOutputData();
      const extent = data.getExtent();
      const spacing = data.getSpacing();

      const sizeX = extent[1] * spacing[0];
      const sizeY = extent[3] * spacing[1];

      const clipPlane1Origin = [
        clipPlane1Position * clipPlane1Normal[0],
        clipPlane1Position * clipPlane1Normal[1],
        clipPlane1Position * clipPlane1Normal[2],
      ];
      const clipPlane2Origin = [
        clipPlane2Position * clipPlane2Normal[0],
        clipPlane2Position * clipPlane2Normal[1],
        clipPlane2Position * clipPlane2Normal[2],
      ];

      clipPlane1.setNormal(clipPlane1Normal);
      clipPlane1.setOrigin(clipPlane1Origin);
      clipPlane2.setNormal(clipPlane2Normal);
      clipPlane2.setOrigin(clipPlane2Origin);

      mapper.addClippingPlane(clipPlane1);
      mapper.addClippingPlane(clipPlane2);

      sphereMapper.addClippingPlane(clipPlane1);
      sphereMapper.addClippingPlane(clipPlane2);

      renderer.addVolume(actor);
      renderer.resetCamera();

      renderWindow.render();

      let el = document.querySelector('.plane1Position');
      el.setAttribute('min', -sizeX);
      el.setAttribute('max', sizeX);
      el.setAttribute('value', clipPlane1Position);

      el = document.querySelector('.plane2Position');
      el.setAttribute('min', -sizeY);
      el.setAttribute('max', sizeY);
      el.setAttribute('value', clipPlane2Position);
    });
  });

// TEST PARALLEL ==============

let isParallel = false;
const button = document.querySelector('.text');

function toggleParallel() {
  isParallel = !isParallel;
  const camera = renderer.getActiveCamera();
  camera.setParallelProjection(isParallel);

  renderer.resetCamera();

  button.innerText = `(${isParallel ? 'on' : 'off'})`;

  renderWindow.render();
}

document.querySelector('.plane1Position').addEventListener('input', (e) => {
  clipPlane1Position = Number(e.target.value);
  const clipPlane1Origin = [
    clipPlane1Position * clipPlane1Normal[0],
    clipPlane1Position * clipPlane1Normal[1],
    clipPlane1Position * clipPlane1Normal[2],
  ];

  clipPlane1.setOrigin(clipPlane1Origin);
  renderWindow.render();
});

document.querySelector('.plane2Position').addEventListener('input', (e) => {
  clipPlane2Position = Number(e.target.value);

  const clipPlane2Origin = [
    clipPlane2Position * clipPlane2Normal[0],
    clipPlane2Position * clipPlane2Normal[1],
    clipPlane2Position * clipPlane2Normal[2],
  ];

  clipPlane2.setOrigin(clipPlane2Origin);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.toggleParallel = toggleParallel;
