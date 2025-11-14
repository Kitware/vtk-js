import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkWindowedSincPolyDataFilter from '@kitware/vtk.js/Filters/General/WindowedSincPolyDataFilter';

import GUI from 'lil-gui';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const actor = vtkActor.newInstance();
renderer.addActor(actor);

const mapper = vtkMapper.newInstance({ interpolateScalarBeforeMapping: true });
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
renderer.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 10);
cam.setClippingRange(0.1, 50.0);

// Build pipeline
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
reader.setUrl(`${__BASE_PATH__}/data/cow.vtp`).then(() => {
  reader.loadData().then(() => {
    renderer.resetCamera();
    renderWindow.render();
  });
});

const smoothFilter = vtkWindowedSincPolyDataFilter.newInstance({
  nonManifoldSmoothing: 0,
  numberOfIterations: 10,
});
smoothFilter.setInputConnection(reader.getOutputPort());
mapper.setInputConnection(smoothFilter.getOutputPort());

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = {
  numberOfIterations: 20,
  passBand: 0.25,
  featureAngle: 45,
  edgeAngle: 15,
  nonManifoldSmoothing: 0,
  featureEdgeSmoothing: 0,
  boundarySmoothing: 1,
};
gui
  .add(params, 'numberOfIterations', 0, 100, 1)
  .name('Iterations')
  .onChange((v) => {
    smoothFilter.set({ numberOfIterations: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'passBand', 0, 2, 0.001)
  .name('Pass band')
  .onChange((v) => {
    const value = 10.0 ** (-4.0 * Number(v));
    smoothFilter.set({ passBand: value });
    renderWindow.render();
  });
gui
  .add(params, 'featureAngle', 1, 180, 1)
  .name('Feature Angle')
  .onChange((v) => {
    smoothFilter.set({ featureAngle: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'edgeAngle', 1, 180, 1)
  .name('Edge Angle')
  .onChange((v) => {
    smoothFilter.set({ edgeAngle: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'featureEdgeSmoothing')
  .name('Feature Edge Smoothing')
  .onChange((v) => {
    smoothFilter.set({ featureEdgeSmoothing: v ? 1 : 0 });
    renderWindow.render();
  });
gui
  .add(params, 'boundarySmoothing')
  .name('Boundary Smoothing')
  .onChange((v) => {
    smoothFilter.set({ boundarySmoothing: v ? 1 : 0 });
    renderWindow.render();
  });
gui
  .add(params, 'nonManifoldSmoothing')
  .name('Non Manifold Smoothing')
  .onChange((v) => {
    smoothFilter.set({ nonManifoldSmoothing: v ? 1 : 0 });
    renderWindow.render();
  });

// -----------------------------------------------------------

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.filter = smoothFilter;
global.mapper = mapper;
global.actor = actor;
