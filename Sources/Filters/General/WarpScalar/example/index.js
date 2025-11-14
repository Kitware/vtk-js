import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import macro from '@kitware/vtk.js/macros';
import vtk from '@kitware/vtk.js/vtk';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkWarpScalar from '@kitware/vtk.js/Filters/General/WarpScalar';

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

const mapper = vtkMapper.newInstance({ interpolateScalarBeforeMapping: true });
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
renderer.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 10);
cam.setClippingRange(0.1, 50.0);

// Build pipeline
const sphereSource = vtkSphereSource.newInstance({
  thetaResolution: 40,
  phiResolution: 41,
});
const filter = vtkWarpScalar.newInstance({ scaleFactor: 0, useNormal: false });

// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
const randFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => {
    const newArray = new Float32Array(
      inData[0].getPoints().getNumberOfPoints()
    );
    for (let i = 0; i < newArray.length; i++) {
      newArray[i] = i % 2 ? 1 : 0;
    }

    const da = vtkDataArray.newInstance({ name: 'spike', values: newArray });
    const newDataSet =
      outData[0]?.initialize() || vtk({ vtkClass: inData[0].getClassName() });
    newDataSet.shallowCopy(inData[0]);
    newDataSet.getPointData().setScalars(da);
    outData[0] = newDataSet;
  };
})();

randFilter.setInputConnection(sphereSource.getOutputPort());
filter.setInputConnection(randFilter.getOutputPort());
mapper.setInputConnection(filter.getOutputPort());

// Select array to process
filter.setInputArrayToProcess(0, 'spike', 'PointData', 'Scalars');

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = {
  radius: 1.0,
  thetaResolution: 40,
  phiResolution: 41,
  scaleFactor: 0.0,
  useNormal: false,
};
gui
  .add(params, 'radius', 0.5, 2.0, 0.05)
  .name('Radius')
  .onChange((v) => {
    sphereSource.set({ radius: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'thetaResolution', 4, 100, 1)
  .name('Theta Resolution')
  .onChange((v) => {
    sphereSource.set({ thetaResolution: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'phiResolution', 4, 100, 1)
  .name('Phi Resolution')
  .onChange((v) => {
    sphereSource.set({ phiResolution: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'scaleFactor', -0.1, 0.1, 0.001)
  .name('Warp Scale Factor')
  .onChange((v) => {
    filter.set({ scaleFactor: Number(v) });
    renderWindow.render();
  });
gui
  .add(params, 'useNormal')
  .name('Warp use Normal')
  .onChange((v) => {
    filter.set({ useNormal: Boolean(v) });
    renderWindow.render();
  });

// -----------------------------------------------------------

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = sphereSource;
global.filter = filter;
global.mapper = mapper;
global.actor = actor;
