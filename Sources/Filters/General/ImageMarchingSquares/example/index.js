import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMarchingSquares from 'vtk.js/Sources/Filters/General/ImageMarchingSquares';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSampleFunction from 'vtk.js/Sources/Imaging/Hybrid/SampleFunction';
import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere';
// import vtkPlane                   from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkImplicitBoolean from 'vtk.js/Sources/Common/DataModel/ImplicitBoolean';

import controlPanel from './controller.html';

const { Operation } = vtkImplicitBoolean;

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

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

// Build pipeline
const sphere = vtkSphere.newInstance({ center: [-2.5, 0.0, 0.0], radius: 0.5 });
const sphere2 = vtkSphere.newInstance({ center: [2.5, 0.0, 0.0], radius: 0.5 });
// const plane = vtkPlane.newInstance({ origin: [0, 0, 0], normal: [0, 1, 0] });
const impBool = vtkImplicitBoolean.newInstance({
  operation: Operation.UNION,
  functions: [sphere, sphere2],
});
const sample = vtkSampleFunction.newInstance({
  implicitFunction: impBool,
  sampleDimensions: [5, 3, 3],
  modelBounds: [-5.0, 5.0, -1.0, 1.0, -1.0, 1.0],
});

// Isocontour
const mSquares = vtkImageMarchingSquares.newInstance({ slice: 1 });

// Connect the pipeline proper
mSquares.setInputConnection(sample.getOutputPort());
mapper.setInputConnection(mSquares.getOutputPort());

// Update the pipeline to obtain metadata (range) about scalars
sample.update();
const cValues = [];
const [min, max] = sample
  .getOutputData()
  .getPointData()
  .getScalars()
  .getRange();
for (let i = 0; i < 20; ++i) {
  cValues[i] = min + (i / 19) * (max - min);
}
mSquares.setContourValues(cValues);

// Create an outline
const outline = vtkOutlineFilter.newInstance();
outline.setInputConnection(sample.getOutputPort());
const outlineMapper = vtkMapper.newInstance();
outlineMapper.setInputConnection(outline.getOutputPort());
const outlineActor = vtkActor.newInstance();
outlineActor.setMapper(outlineMapper);
renderer.addActor(outlineActor);

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------
fullScreenRenderer.addController(controlPanel);

// Define the volume resolution
document.querySelector('.volumeResolution').addEventListener('input', (e) => {
  const value = Number(e.target.value);
  sample.setSampleDimensions(value, value, value);
  mSquares.setSlice(value / 2.0);
  renderWindow.render();
});

// Define the sphere radius
document.querySelector('.sphereRadius').addEventListener('input', (e) => {
  const value = Number(e.target.value);
  sphere.setRadius(value);
  sphere2.setRadius(value);
  sample.modified();
  renderWindow.render();
});

// Indicate whether to merge conincident points or not
document.querySelector('.mergePoints').addEventListener('change', (e) => {
  mSquares.setMergePoints(!!e.target.checked);
  renderWindow.render();
});

// -----------------------------------------------------------
const cam = renderer.getActiveCamera();
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 1);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = sample;
global.filter = mSquares;
global.mapper = mapper;
global.actor = actor;
