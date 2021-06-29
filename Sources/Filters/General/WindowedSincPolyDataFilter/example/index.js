import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkWindowedSincPolyDataFilter from 'vtk.js/Sources/Filters/General/WindowedSincPolyDataFilter';

import controlPanel from './controller.html';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
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

fullScreenRenderer.addController(controlPanel);

// Warp setup
[
  'numberOfIterations',
  'passBand',
  'featureAngle',
  'edgeAngle',
  'nonManifoldSmoothing',
  'featureEdgeSmoothing',
  'boundarySmoothing',
].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    let value;
    if (Number.isNaN(e.target.valueAsNumber)) {
      value = e.target.checked ? 1 : 0;
    } else {
      value = e.target.valueAsNumber;
    }
    if (propertyName === 'passBand') {
      // This formula maps:
      // 0.0  -> 1.0   (almost no smoothing)
      // 0.25 -> 0.1   (average smoothing)
      // 0.5  -> 0.01  (more smoothing)
      // 1.0  -> 0.001 (very strong smoothing)
      value = 10.0 ** (-4.0 * value);
    }
    smoothFilter.set({ [propertyName]: value });
    renderWindow.render();
    console.log({ [propertyName]: value });
  });
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
