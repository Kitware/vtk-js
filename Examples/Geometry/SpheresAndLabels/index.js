import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Molecule'; // for vtkSphereMapper

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkSphereMapper from '@kitware/vtk.js/Rendering/Core/SphereMapper';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkPixelSpaceCallbackMapper from '@kitware/vtk.js/Rendering/Core/PixelSpaceCallbackMapper';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

import style from './style.module.css';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

let textCtx = null;
let dims = null;

const renderWindow = vtkRenderWindow.newInstance();
const renderer = vtkRenderer.newInstance({ background: [0.2, 0.3, 0.4] });
renderWindow.addRenderer(renderer);

// ----------------------------------------------------------------------------
// Simple pipeline ConeSource --> Mapper --> Actor
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

const mapper = vtkSphereMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
psMapper.setInputConnection(coneSource.getOutputPort());
psMapper.setCallback((coordsList) => {
  if (textCtx && dims) {
    textCtx.clearRect(0, 0, dims.width, dims.height);
    coordsList.forEach((xy, idx) => {
      textCtx.font = '12px serif';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      textCtx.fillText(`p ${idx}`, xy[0], dims.height - xy[1]);
    });
  }
});

const textActor = vtkActor.newInstance();
textActor.setMapper(psMapper);

// ----------------------------------------------------------------------------
// Add the actor to the renderer and set the camera based on it
// ----------------------------------------------------------------------------

renderer.addActor(actor);
renderer.addActor(textActor);
renderer.resetCamera();

// ----------------------------------------------------------------------------
// Use OpenGL as the backend to view the all this
// ----------------------------------------------------------------------------

const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
renderWindow.addView(openGLRenderWindow);

// ----------------------------------------------------------------------------
// Create a div section to put this into
// ----------------------------------------------------------------------------

const container = document.createElement('div');
container.classList.add(style.container);
document.querySelector('body').appendChild(container);
openGLRenderWindow.setContainer(container);

const textCanvas = document.createElement('canvas');
textCanvas.classList.add(style.container, 'textCanvas');
container.appendChild(textCanvas);

textCtx = textCanvas.getContext('2d');

// ----------------------------------------------------------------------------
// Setup an interactor to handle mouse events
// ----------------------------------------------------------------------------

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(openGLRenderWindow);
interactor.initialize();
interactor.bindEvents(container);

interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

// Handle window resize
function resize() {
  dims = container.getBoundingClientRect();
  openGLRenderWindow.setSize(dims.width, dims.height);
  textCanvas.setAttribute('width', dims.width);
  textCanvas.setAttribute('height', dims.height);
  renderWindow.render();
}

window.addEventListener('resize', resize);

resize();
