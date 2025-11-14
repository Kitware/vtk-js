import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

import GUI from 'lil-gui';
// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.2, 0.3, 0.4],
});
const renderWindow = fullScreenRenderer.getRenderWindow();
const renderer = fullScreenRenderer.getRenderer();
renderWindow.addRenderer(renderer);
const interactor = fullScreenRenderer.getInteractor();

// ----------------------------------------------------------------------------
// Simple pipeline ConeSource --> Mapper --> Actor
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

// ----------------------------------------------------------------------------
// Add the actor to the renderer and set the camera based on it
// ----------------------------------------------------------------------------

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// Setup interactor style to use
// ----------------------------------------------------------------------------

const trackballCamera = vtkInteractorStyleTrackballCamera.newInstance();
interactor.setInteractorStyle(trackballCamera);

// ----------------------------------------------------------------------------
//  Add control panel and listen for changes
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = { Motion: 10, Zoom: 10 };
gui.add(params, 'Motion', 1, 100, 1).onChange((v) => {
  trackballCamera.setMotionFactor(Number(v));
  renderWindow.render();
});
gui.add(params, 'Zoom', 1, 100, 1).onChange((v) => {
  trackballCamera.setZoomFactor(Number(v));
  renderWindow.render();
});
