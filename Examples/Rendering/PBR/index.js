import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkLight from '@kitware/vtk.js/Rendering/Core/Light';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkPolyDataNormals from '@kitware/vtk.js/Filters/Core/PolyDataNormals';

import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.08, 0.08, 0.08],
});
const renderer = fullScreenRenderer.getRenderer();
renderer.setUseEnvironmentTextureAsBackground(true);
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
  _img.onload = () => {
    _tex.setInterpolate(true);
    _tex.setEdgeClamp(true);
    _tex.setImage(_img);
  };
  return _tex;
}

// Texture loading helper function
function createTextureWithMipmap(src, level) {
  const _img = new Image();
  _img.crossOrigin = 'Anonymous';
  _img.src = src;
  const _tex = vtkTexture.newInstance();
  _tex.setMipLevel(level);
  _img.onload = () => {
    _tex.setInterpolate(true);
    _tex.setEdgeClamp(true);
    _tex.setImage(_img);
  };
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
  actor.getProperty().setEmission(0.6);
  actor.getProperty().setMetallic(1.0);
  actor.getProperty().setNormalStrength(0.5);
  actor.getProperty().setBaseIOR(1.33);
  actor.getProperty().setDiffuseColor(1.0, 1.0, 1.0);
  actor.getProperty().setAmbientColor(1.0, 1.0, 1.0);

  // Texture loading
  const diffuseTex = createTexture(`${__BASE_PATH__}/data/pbr/diffuse.jpg`);
  const aoTex = createTexture(`${__BASE_PATH__}/data/pbr/ao.jpg`);
  const roughnessTex = createTexture(`${__BASE_PATH__}/data/pbr/roughness.jpg`);
  const metallicTex = createTexture(`${__BASE_PATH__}/data/pbr/metallic.jpg`);
  const emissionTex = createTexture(`${__BASE_PATH__}/data/pbr/emission.jpg`);
  const normalTex = createTexture(`${__BASE_PATH__}/data/pbr/normal.jpg`);
  const environmentTex = createTextureWithMipmap(
    `${__BASE_PATH__}/data/pbr/kiara_dawn_4k.jpg`,
    8
  );
  actor.getProperty().setDiffuseTexture(diffuseTex);
  actor.getProperty().setAmbientOcclusionTexture(aoTex);
  actor.getProperty().setRoughnessTexture(roughnessTex);
  actor.getProperty().setMetallicTexture(metallicTex);
  actor.getProperty().setEmissionTexture(emissionTex);
  actor.getProperty().setNormalTexture(normalTex);
  renderer.setEnvironmentTexture(environmentTex);
  renderer.setEnvironmentTextureDiffuseStrength(1);
  renderer.setEnvironmentTextureSpecularStrength(1);

  actor.setMapper(mapper);
  mapper.setInputData(polydata);

  renderer.addActor(actor);
  renderWindow.render();
});

// ----------------------------------------------
// Adding lights and other scene properties
// ----------------------------------------------

const redLight = vtkLight.newInstance({
  positional: false,
  color: [1.5, 0.4, 0.2],
  intensity: 0.5,
});
redLight.setDirection([0.8, 1, -1]); // setDirection allows for direct setting instead of through a focal point
renderer.addLight(redLight);

renderer.resetCamera();
renderWindow.render();
fpsMonitor.update();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  Color: '#ffffff',
  Roughness: 1.0,
  Metallic: 1.0,
  Normal: 0.5,
  IOR: 1.33,
  UseBackground: true,
  SpecularStrength: 1.0,
  DiffuseStrength: 1.0,
  FOV: 30,
};
if (!('gpu' in navigator)) {
  gui.add({ Warning: 'WebGPU not supported (fallback WebGL)' }, 'Warning');
}
gui.addColor(params, 'Color').onChange((val) => {
  const color = hexToRGB(val);
  if (!color) return;
  actor
    .getProperty()
    .setDiffuseColor(color.r / 255.0, color.g / 255.0, color.b / 255.0);
  actor
    .getProperty()
    .setAmbientColor(color.r / 255.0, color.g / 255.0, color.b / 255.0);
  renderWindow.render();
  fpsMonitor.update();
});
gui.add(params, 'Roughness', 0.0, 1.0, 0.01).onChange((v) => {
  actor.getProperty().setRoughness(Number(v));
  renderWindow.render();
  fpsMonitor.update();
});
gui.add(params, 'Metallic', 0.0, 1.0, 0.01).onChange((v) => {
  actor.getProperty().setMetallic(Number(v));
  renderWindow.render();
  fpsMonitor.update();
});
gui.add(params, 'Normal', 0.0, 1.0, 0.01).onChange((v) => {
  actor.getProperty().setNormalStrength(Number(v));
  renderWindow.render();
  fpsMonitor.update();
});
gui.add(params, 'IOR', 0.0, 3.0, 0.01).onChange((v) => {
  actor.getProperty().setBaseIOR(Number(v));
  renderWindow.render();
  fpsMonitor.update();
});
gui
  .add(params, 'UseBackground')
  .name('Use Textured Background')
  .onChange((v) => {
    renderer.setUseEnvironmentTextureAsBackground(Boolean(v));
    renderWindow.render();
    fpsMonitor.update();
  });
gui.add(params, 'SpecularStrength', 0.0, 2.0, 0.01).onChange((v) => {
  renderer.setEnvironmentTextureSpecularStrength(Number(v));
  renderWindow.render();
  fpsMonitor.update();
});
gui.add(params, 'DiffuseStrength', 0.0, 2.0, 0.01).onChange((v) => {
  renderer.setEnvironmentTextureDiffuseStrength(Number(v));
  renderWindow.render();
  fpsMonitor.update();
});
gui.add(params, 'FOV', 30, 120, 1).onChange((v) => {
  renderer.getActiveCamera().setViewAngle(Number(v));
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
