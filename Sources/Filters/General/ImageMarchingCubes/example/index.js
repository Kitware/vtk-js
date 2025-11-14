import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSampleFunction from '@kitware/vtk.js/Imaging/Hybrid/SampleFunction';
import vtkSphere from '@kitware/vtk.js/Common/DataModel/Sphere';

import GUI from 'lil-gui';

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
const sphere = vtkSphere.newInstance({ center: [0.0, 0.0, 0.0], radius: 0.5 });
const sample = vtkSampleFunction.newInstance({
  implicitFunction: sphere,
  sampleDimensions: [50, 50, 50],
  modelBounds: [-0.5, 0.5, -0.5, 0.5, -0.5, 0.5],
});
const mCubes = vtkImageMarchingCubes.newInstance({ contourValue: 0.0 });

// Connect the pipeline proper
mCubes.setInputConnection(sample.getOutputPort());
mapper.setInputConnection(mCubes.getOutputPort());

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------
const gui = new GUI();
const params = {
  VolumeResolution: 50,
  Radius: 0.025,
  IsoValue: 0.0,
  ComputeNormals: false,
  MergePoints: false,
};
gui
  .add(params, 'VolumeResolution', 10, 100, 1)
  .name('Volume resolution')
  .onChange((v) => {
    const value = Number(v);
    sample.setSampleDimensions(value, value, value);
    renderWindow.render();
  });
gui
  .add(params, 'Radius', 0.01, 1.0, 0.01)
  .name('Radius')
  .onChange((v) => {
    sphere.setRadius(Number(v));
    renderWindow.render();
  });
gui
  .add(params, 'IsoValue', 0.0, 1.0, 0.05)
  .name('Iso value')
  .onChange((v) => {
    mCubes.setContourValue(Number(v));
    renderWindow.render();
  });
gui
  .add(params, 'ComputeNormals')
  .name('Compute Normals')
  .onChange((v) => {
    mCubes.setComputeNormals(Boolean(v));
    renderWindow.render();
  });
gui
  .add(params, 'MergePoints')
  .name('Merge Points')
  .onChange((v) => {
    mCubes.setMergePoints(Boolean(v));
    renderWindow.render();
  });

// -----------------------------------------------------------

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = sample;
global.filter = mCubes;
global.mapper = mapper;
global.actor = actor;
