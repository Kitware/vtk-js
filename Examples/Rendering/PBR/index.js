import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkPolyDataNormals from 'vtk.js/Sources/Filters/Core/PolyDataNormals';

import vtkFPSMonitor from 'vtk.js/Sources/Interaction/UI/FPSMonitor';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.08, 0.08, 0.08],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const fpsMonitor = vtkFPSMonitor.newInstance();
const fpsElm = fpsMonitor.getFpsMonitorContainer();
fpsElm.style.position = 'absolute';
fpsElm.style.left = '10px';
fpsElm.style.bottom = '10px';
fpsElm.style.background = 'rgba(255,255,255,0.5)';
fpsElm.style.borderRadius = '5px';

fpsMonitor.setContainer(document.querySelector('body'));
fpsMonitor.setRenderWindow(renderWindow);

fullScreenRenderer.setResizeCallback(fpsMonitor.update);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// Converts the HTML color picker value into usable RGB
function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
// Texture loading helper function
function createTexture(src) {
  const _img = new Image();
  _img.crossOrigin = 'Anonymous';
  _img.src = src;
  const _tex = vtkTexture.newInstance();
  _tex.setInterpolate(true);
  _tex.setEdgeClamp(true);
  _tex.setImage(_img);
  return _tex;
}

// ---------------------------------
// Model and texture loading
// ---------------------------------

const reader = vtkOBJReader.newInstance();
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

reader.setSplitMode('usemtl');
reader.setUrl(`${__BASE_PATH__}/data/pbr/helmet.obj`).then(() => {
  const polydata = reader.getOutputData(0);
  // Normals
  const normals = vtkPolyDataNormals.newInstance();
  normals.setInputData(polydata);
  // optional recalculation
  // normals.update();

  // Setting default values
  actor.setPosition(0.0, 0.0, 0.0);
  actor.getProperty().setRoughness(1.0);
  actor.getProperty().setEmission(5.0);
  actor.getProperty().setMetallic(1.0);
  actor.getProperty().setNormalStrength(0.5);
  actor.getProperty().setBaseIOR(1.33);
  actor.getProperty().setDiffuseColor(1.0, 1.0, 1.0);
  actor.getProperty().setAmbientColor(1.0, 1.0, 1.0);

  // Texture loading
  const diffuseTex = createTexture(`${__BASE_PATH__}/data/pbr/diffuse.jpg`);
  const roughnessTex = createTexture(`${__BASE_PATH__}/data/pbr/roughness.jpg`);
  const metallicTex = createTexture(`${__BASE_PATH__}/data/pbr/metallic.jpg`);
  const emissionTex = createTexture(`${__BASE_PATH__}/data/pbr/emission.jpg`);
  const normalTex = createTexture(`${__BASE_PATH__}/data/pbr/normal.jpg`);

  actor.getProperty().setDiffuseTexture(diffuseTex);
  actor.getProperty().setRoughnessTexture(roughnessTex);
  actor.getProperty().setMetallicTexture(metallicTex);
  actor.getProperty().setEmissionTexture(emissionTex);
  actor.getProperty().setNormalTexture(normalTex);

  actor.setMapper(mapper);
  mapper.setInputData(polydata);

  renderer.addActor(actor);
  renderWindow.render();
});

// ----------------------------------------------
// Adding lights and other scene properties
// ----------------------------------------------

const baseLight = vtkLight.newInstance({
  positional: false,
  color: [1, 0.95, 1],
  intensity: 2,
});
baseLight.setDirection([0, 0.5, 1]); // setDirection allows for direct setting instead of through a focal point
renderer.addLight(baseLight);

const rimLight = vtkLight.newInstance({
  positional: false,
  color: [1, 0.95, 1],
  intensity: 2,
});
rimLight.setDirection([-0.4, -0.2, -1]);
renderer.addLight(rimLight);

const redLight = vtkLight.newInstance({
  positional: false,
  color: [1.5, 0.4, 0.2],
  intensity: 1,
});
redLight.setDirection([1, 0, 0]);
renderer.addLight(redLight);

const blueLight = vtkLight.newInstance({
  positional: false,
  color: [0.2, 0.4, 1.5],
  intensity: 1,
});
blueLight.setDirection([-1, 0, 0]);
renderer.addLight(blueLight);

renderer.resetCamera();
renderWindow.render();
fpsMonitor.update();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const colorChange = document.querySelector('.color');
const roughnessChange = document.querySelector('.roughness');
const metallicChange = document.querySelector('.metallic');
const normalChange = document.querySelector('.normal');
const iorChange = document.querySelector('.ior');

roughnessChange.addEventListener('input', (e) => {
  const roughness = Number(e.target.value);
  actor.getProperty().setRoughness(roughness);
  renderWindow.render();
  fpsMonitor.update();
});

metallicChange.addEventListener('input', (e) => {
  const metallic = Number(e.target.value);
  actor.getProperty().setMetallic(metallic);
  renderWindow.render();
  fpsMonitor.update();
});

normalChange.addEventListener('input', (e) => {
  const normal = Number(e.target.value);
  actor.getProperty().setNormalStrength(normal);
  renderWindow.render();
  fpsMonitor.update();
});

iorChange.addEventListener('input', (e) => {
  const ior = Number(e.target.value);
  actor.getProperty().setBaseIOR(ior);
  renderWindow.render();
  fpsMonitor.update();
});

colorChange.addEventListener('input', (e) => {
  const color = hexToRGB(e.target.value);
  actor
    .getProperty()
    .setDiffuseColor(color.r / 255.0, color.g / 255.0, color.b / 255.0);
  actor
    .getProperty()
    .setAmbientColor(color.r / 255.0, color.g / 255.0, color.b / 255.0);
  renderWindow.render();
  fpsMonitor.update();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
