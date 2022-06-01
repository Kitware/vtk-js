import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

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
    name: '- Red',
    properties: { color: [1, 0.6, 0.6] },
  },
  {
    name: 'Edge - Red',
    properties: { edgeVisibility: true, color: [1, 0.6, 0.6] },
  },
  {
    name: '- Blue',
    properties: { color: [0.6, 0.6, 1] },
  },
  {
    name: 'Edge - Green',
    properties: { edgeVisibility: true, color: [0.6, 1, 0.6] },
  },
  {
    name: '- Green',
    properties: { color: [0.6, 1, 0.6] },
  },
  {
    name: 'Edge - Blue',
    properties: { edgeVisibility: true, color: [0.6, 0.6, 1] },
  },
];

// ----------------------------------------------------------------------------
// Background colors
// ----------------------------------------------------------------------------

const colors = [
  [0.2, 0.2, 0.2],
  [0.4, 0.2, 0.3],
  [0.2, 0.4, 0.3],
  [0.6, 0.6, 0.6],
  [0.2, 0.4, 0.4],
  [0.3, 0.4, 0.2],
  [0.3, 0.2, 0.4],
];

// ----------------------------------------------------------------------------
// Single RenderWindow in fullscreen
// ----------------------------------------------------------------------------

const RENDERERS = {};

const renderWindow = vtkRenderWindow.newInstance();
const renderWindowView = renderWindow.newAPISpecificView();
renderWindow.addView(renderWindowView);

const rootContainer = document.createElement('div');
rootContainer.style.position = 'fixed';
rootContainer.style.zIndex = -1;
rootContainer.style.left = 0;
rootContainer.style.top = 0;
rootContainer.style.pointerEvents = 'none';
document.body.appendChild(rootContainer);

renderWindowView.setContainer(rootContainer);

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(renderWindowView);
interactor.initialize();
interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

function updateViewPort(element, renderer) {
  const { innerHeight, innerWidth } = window;
  const { x, y, width, height } = element.getBoundingClientRect();
  const viewport = [
    x / innerWidth,
    1 - (y + height) / innerHeight,
    (x + width) / innerWidth,
    1 - y / innerHeight,
  ];
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
  rootContainer.style.width = `${window.innerWidth}px`;
  renderWindowView.setSize(window.innerWidth, window.innerHeight);
  recomputeViewports();
}

new ResizeObserver(resize).observe(document.body);
document.addEventListener('scroll', recomputeViewports);

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
  element.style.color = 'white';
  return element;
}

let captureCurrentRenderer = false;

function setCaptureCurrentRenderer(yn) {
  captureCurrentRenderer = yn;
  if (yn && interactor.getCurrentRenderer()) {
    // fix the current renderer to, well, the current renderer
    interactor.setCurrentRenderer(interactor.getCurrentRenderer());
  } else {
    // remove the fixed current renderer
    interactor.setCurrentRenderer(null);
  }
}

function bindInteractor(renderer, el) {
  // only change the interactor's container if needed
  if (interactor.getContainer() !== el) {
    if (interactor.getContainer()) {
      interactor.unbindEvents();
    }
    if (captureCurrentRenderer) {
      interactor.setCurrentRenderer(renderer);
    }
    if (el) {
      interactor.bindEvents(el);
    }
  }
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
  actor.getProperty().setDiffuse(0.9);
  actor.getProperty().setSpecular(0.2);
  actor.getProperty().setSpecularPower(30);
  actor.getProperty().setSpecularColor(1.0, 1.0, 1.0);
  const renderer = vtkRenderer.newInstance({ background });
  container.innerHTML = `${mesh.name} ${prop.name}`;

  container.addEventListener('pointerenter', () =>
    bindInteractor(renderer, container)
  );
  container.addEventListener('pointerleave', () => bindInteractor(null, null));

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

const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.name = 'singleRendererCapture';
const label = document.createElement('label');
label.for = checkbox.name;
label.innerText = 'Enable single renderer capture';

checkbox.addEventListener('input', (ev) => {
  setCaptureCurrentRenderer(ev.target.checked);
});

document.body.appendChild(checkbox);
document.body.appendChild(label);
document.body.appendChild(document.createElement('br'));

for (let i = 0; i < 64; i++) {
  addRenderer();
}
resize();

function updateCamera(renderer) {
  const camera = renderer.getActiveCamera();
  camera.azimuth(0.5);
  renderer.resetCameraClippingRange();
}

function animate() {
  Object.values(RENDERERS).forEach(updateCamera);
  renderWindow.render();
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

global.rw = renderWindow;
global.glrw = renderWindowView;
global.renderers = RENDERERS;
