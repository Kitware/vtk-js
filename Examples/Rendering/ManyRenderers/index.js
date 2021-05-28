import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';

// ----------------------------------------------------------------------------
// Meshes
// ----------------------------------------------------------------------------

const meshes = [];

function addMesh(name, source) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputData(source.getOutputData());
  meshes.push({ name, mapper });
}

addMesh('Cone', vtkConeSource.newInstance());
addMesh('Sphere', vtkSphereSource.newInstance());
addMesh('Cube', vtkCubeSource.newInstance());
addMesh('Cylinder', vtkCylinderSource.newInstance());

// ----------------------------------------------------------------------------
// Properties
// ----------------------------------------------------------------------------

const properties = [
  {
    name: '- Solid Red',
    properties: { color: [1, 0, 0] },
  },
  {
    name: 'Edge - Solid Blue',
    properties: { edgeVisibility: true, color: [0, 0, 1] },
  },
  {
    name: '- Solid Green',
    properties: { color: [0, 1, 0] },
  },
  {
    name: 'Edge - Solid Red',
    properties: { edgeVisibility: true, color: [1, 0, 0] },
  },
  {
    name: '- Solid Blue',
    properties: { color: [0, 0, 1] },
  },
  {
    name: 'Edge - Solid Green',
    properties: { edgeVisibility: true, color: [0, 1, 0] },
  },
];

// ----------------------------------------------------------------------------
// Background colors
// ----------------------------------------------------------------------------

const colors = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [0.5, 0.5, 0.5],
  [1, 1, 1],
];

// ----------------------------------------------------------------------------
// Single RenderWindow in fullscreen
// ----------------------------------------------------------------------------

const RENDERERS = {};

const renderWindow = vtkRenderWindow.newInstance();
const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
renderWindow.addView(openglRenderWindow);

const rootContainer = document.createElement('div');
rootContainer.style.position = 'fixed';
rootContainer.style.left = 0;
rootContainer.style.top = 0;
rootContainer.style.bottom = 0;
rootContainer.style.right = 0;
rootContainer.style.pointerEvents = 'none';
document.body.appendChild(rootContainer);

openglRenderWindow.setContainer(rootContainer);

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(document.body);
interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

function updateViewPort(element, renderer) {
  const { innerWidth, innerHeight } = window;
  const { x, y, width, height } = element.getBoundingClientRect();
  const viewport = [
    x / innerWidth,
    1 - y / innerHeight,
    (x + width) / innerWidth,
    1 - (y + height) / innerHeight,
  ];
  // console.log(viewport);
  renderer.setViewport(...viewport);
}

function recomputeViewports() {
  const rendererElems = document.querySelectorAll('.renderer');
  for (let i = 0; i < rendererElems.length; i++) {
    const elem = rendererElems[i];
    const { id } = elem;
    const renderer = RENDERERS[id];
    updateViewPort(elem, renderer);
  }
  renderWindow.render();
}

function resize() {
  openglRenderWindow.setSize(window.innerWidth, window.innerHeight);
  recomputeViewports();
  // Object.values(RENDERERS).forEach((r) => r.resetCamera());
}

window.addEventListener('resize', resize);
document.addEventListener('scroll', recomputeViewports);
resize();

// ----------------------------------------------------------------------------
// Renderers
// ----------------------------------------------------------------------------

let meshIndex = 0;
let propertyIndex = 0;
let bgIndex = 0;
let rendererId = 1;

function applyStyle(element) {
  element.classList.add('renderer');
  element.style.width = '200px';
  element.style.height = '200px';
  element.style.margin = '20px';
  element.style.border = 'solid 1px #333';
  element.style.display = 'inline-block';
  element.style.boxSizing = 'border';
  element.style.textAlign = 'center';
  return element;
}

function enterCurrentRenderer(e) {
  interactor.setCurrentRenderer(RENDERERS[e.target.id]);
}

function exitCurrentRenderer(e) {
  interactor.setCurrentRenderer(null);
}

function addRenderer() {
  const mesh = meshes[meshIndex];
  const prop = properties[propertyIndex];
  const background = colors[bgIndex];
  meshIndex = (meshIndex + 1) % meshes.length;
  propertyIndex = (propertyIndex + 1) % properties.length;
  bgIndex = (bgIndex + 1) % colors.length;

  const container = applyStyle(document.createElement('div'));
  container.id = rendererId++;
  document.body.appendChild(container);

  const actor = vtkActor.newInstance();
  actor.setMapper(mesh.mapper);
  actor.getProperty().set(prop.properties);
  const renderer = vtkRenderer.newInstance({ background });
  container.innerHTML = `${mesh.name} ${prop.name}`;

  container.addEventListener('mouseenter', enterCurrentRenderer);
  container.addEventListener('mouseleave', exitCurrentRenderer);

  renderer.addActor(actor);
  renderWindow.addRenderer(renderer);
  updateViewPort(container, renderer);
  renderer.resetCamera();

  // Keep track of renderer
  RENDERERS[container.id] = renderer;
}

// ----------------------------------------------------------------------------
// Fill up page
// ----------------------------------------------------------------------------

for (let i = 0; i < 64; i++) {
  addRenderer();
}

// function updateCamera(renderer) {
//   const camera = renderer.getActiveCamera();
//   camera.azimuth(2);
// }

// function animate() {
//   console.log('animate');
//   Object.values(RENDERERS).forEach(updateCamera);
//   renderWindow.render();
//   window.requestAnimationFrame(animate);
// }

// window.requestAnimationFrame(animate);

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

global.rw = renderWindow;
global.glrw = openglRenderWindow;
global.renderers = RENDERERS;
