import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkLight from '@kitware/vtk.js/Rendering/Core/Light';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import controlPanel from './controller.html';

const { Representation, Shading } = vtkProperty;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
renderer.setTwoSidedLighting(false);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
mapper.setVolumetricScatteringBlending(0);
mapper.setLocalAmbientOcclusion(0);
mapper.setLAOKernelSize(10);
mapper.setLAOKernelRadius(5);
mapper.setComputeNormalFromOpacity(true);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 0.3, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.1);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setScalarOpacityUnitDistance(0, 2.955);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.5);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.0);

mapper.setInputConnection(reader.getOutputPort());
renderer.addVolume(actor);

renderer.removeAllLights();
const light = vtkLight.newInstance();
light.setLightTypeToSceneLight();
light.setPositional(true);
light.setPosition(450, 300, 200);
light.setFocalPoint(0, 0, 0);
light.setColor(0, 0.45, 0.45);
light.setConeAngle(25);
light.setIntensity(1.0);
renderer.addLight(light);

// Visualize the light source
if (light.getPositional()) {
  const ls = vtkSphereSource.newInstance({
    center: light.getPosition(),
    radius: 5.0,
  });
  const lm = vtkMapper.newInstance();
  lm.setInputConnection(ls.getOutputPort());
  const la = vtkActor.newInstance({ mapper: lm });
  la.getProperty().setColor(1, 1, 1);
  la.getProperty().setRepresentation(Representation.WIREFRAME);
  la.getProperty().setInterpolation(Shading.FLAT);
  la.getProperty().setColor(light.getColor());
  la.getProperty().setLineWidth(2.0);
  renderer.addActor(la);

  const lightDir = [0, 0, 0];
  vtkMath.subtract(light.getFocalPoint(), light.getPosition(), lightDir);
  vtkMath.normalize(lightDir);
  const frustumCenter = light.getPosition();
  const frustumHeight = 80;
  const frustumRadius =
    frustumHeight * Math.tan((light.getConeAngle() * 1.0 * Math.PI) / 180);
  const halfDir = [0, 0, 0];
  vtkMath.add(
    frustumCenter,
    vtkMath.multiplyScalar(lightDir, frustumHeight * 0.5),
    halfDir
  );
  vtkMath.multiplyScalar(lightDir, -1, lightDir);
  const lc = vtkConeSource.newInstance({
    center: halfDir,
    radius: frustumRadius,
    height: frustumHeight,
    direction: lightDir,
    resolution: 6,
  });
  const lcm = vtkMapper.newInstance();
  lcm.setInputConnection(lc.getOutputPort());
  const lca = vtkActor.newInstance({ mapper: lcm });
  lca.getProperty().setColor(1, 1, 1);
  lca.getProperty().setRepresentation(Representation.WIREFRAME);
  lca.getProperty().setInterpolation(Shading.FLAT);
  lca.getProperty().setColor(light.getColor());
  lca.getProperty().setLineWidth(2.0);
  renderer.addActor(lca);
}

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.getActiveCamera().azimuth(90);
    renderer.getActiveCamera().roll(90);
    renderer.getActiveCamera().azimuth(-60);
    renderer.resetCamera();
    renderWindow.render();
  });
});

// TEST  ==============

fullScreenRenderer.addController(controlPanel);
let isLAO = false;
const button = document.querySelector('.text');

const lao = document.querySelector('.lao');
lao.addEventListener('click', (e) => {
  isLAO = !isLAO;
  mapper.setLocalAmbientOcclusion(isLAO);
  button.innerText = `(${isLAO ? 'on' : 'off'})`;
  renderWindow.render();
});

const vs = document.querySelector('.scattering');
vs.addEventListener('input', (e) => {
  const b = (0.1 * Number(e.target.value)).toPrecision(1);
  const sbutton = document.querySelector('.stext');
  sbutton.innerText = `(${b > 0 ? b : 'off'})`;
  mapper.setVolumetricScatteringBlending(b);
  renderWindow.render();
});

const toggleShade = document.querySelector('.toggleShade');
toggleShade.addEventListener('click', () => {
  const shadeFieldSet = document.querySelector('.shade');
  if (shadeFieldSet.disabled) {
    shadeFieldSet.disabled = false;
    actor.getProperty().setShade(true);
    renderWindow.render();
  } else {
    shadeFieldSet.disabled = true;
    actor.getProperty().setShade(false);
    renderWindow.render();
  }
});

const toggleParallel = document.querySelector('.toggleParallel');
toggleParallel.addEventListener('click', () => {
  const cam = renderer.getActiveCamera();
  cam.setParallelProjection(!cam.getParallelProjection());
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
