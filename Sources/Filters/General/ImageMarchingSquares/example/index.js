import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMarchingSquares from '@kitware/vtk.js/Filters/General/ImageMarchingSquares';
import vtkOutlineFilter from '@kitware/vtk.js/Filters/General/OutlineFilter';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSampleFunction from '@kitware/vtk.js/Imaging/Hybrid/SampleFunction';
import vtkSphere from '@kitware/vtk.js/Common/DataModel/Sphere';
// import vtkPlane                   from '@kitware/vtk.js/Common/DataModel/Plane';
import vtkImplicitBoolean from '@kitware/vtk.js/Common/DataModel/ImplicitBoolean';

import GUI from 'lil-gui';

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
mSquares.setSlicingMode(2);

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
const gui = new GUI();
const params = {
  SlicingMode: 2,
  VolumeResolution: 50,
  Radius: 0.025,
  MergePoints: false,
};
gui
  .add(params, 'SlicingMode', { I: 0, J: 1, K: 2 })
  .name('Slicing mode')
  .onChange((v) => {
    mSquares.setSlicingMode(Number(v));
    renderWindow.render();
  });
gui
  .add(params, 'VolumeResolution', 10, 100, 1)
  .name('Volume resolution')
  .onChange((v) => {
    const value = Number(v);
    sample.setSampleDimensions(value, value, value);
    mSquares.setSlice(value / 2.0);
    renderWindow.render();
  });
gui
  .add(params, 'Radius', 0.01, 1.0, 0.01)
  .name('Radius')
  .onChange((v) => {
    const value = Number(v);
    sphere.setRadius(value);
    sphere2.setRadius(value);
    sample.modified();
    renderWindow.render();
  });
gui
  .add(params, 'MergePoints')
  .name('Merge Points')
  .onChange((v) => {
    mSquares.setMergePoints(Boolean(v));
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
