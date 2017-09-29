import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
// import macro                      from 'vtk.js/Sources/macro';
// import vtk                        from 'vtk.js/Sources/vtk';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera                  from 'vtk.js/Sources/Rendering/Core/Camera';
// import vtkDataArray               from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSphere                  from 'vtk.js/Sources/Common/DataModel/Sphere';
import vtkSampleFunction          from 'vtk.js/Sources/Imaging/Hybrid/SampleFunction';
import vtkImageMarchingCubes      from 'vtk.js/Sources/Filters/General/ImageMarchingCubes';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [1, 0.5, 0.5] });
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

// Build pipeline
const imp = vtkSphere.newInstance({ center: [0.0, 0.0, 0.0], radius: 0.5 });
const sample = vtkSampleFunction.newInstance({ implicitFunction: imp, sampleDimensions: [50, 50, 50], modelBounds: [-0.5, 0.5, -0.5, 0.5, -0.5, 0.5] });
const mc = vtkImageMarchingCubes.newInstance({ contourValue: 0.0 });

// Connect the pipeline proper
mc.setInputConnection(sample.getOutputPort());
mapper.setInputConnection(mc.getOutputPort());

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------
fullScreenRenderer.addController(controlPanel);

// Define the isosurface value
document.querySelector('.isoValue').addEventListener('change', (e) => {
  const value = Number(e.target.value);
  mc.set({ contourValue: value });
  renderWindow.render();
});

// Define the volume resolution
document.querySelector('.volumeResolution').addEventListener('change', (e) => {
  const value = Number(e.target.value);
  sample.set({ sampleDimensions: [value, value, value] });
  renderWindow.render();
});

// Define the sphere radius
document.querySelector('.sphereRadius').addEventListener('change', (e) => {
  const value = Number(e.target.value);
  imp.set({ radius: value });
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
global.filter = mc;
global.mapper = mapper;
global.actor = actor;
