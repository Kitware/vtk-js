import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import macro from 'vtk.js/Sources/macros';
import vtk from 'vtk.js/Sources/vtk';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkWarpScalar from 'vtk.js/Sources/Filters/General/WarpScalar';

import controlPanel from './controller.html';

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
    // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const newArray = new Float32Array(
        inData[0].getPoints().getNumberOfPoints()
      );
      for (let i = 0; i < newArray.length; i++) {
        newArray[i] = i % 2 ? 1 : 0;
      }

      const da = vtkDataArray.newInstance({ name: 'spike', values: newArray });
      const newDataSet = vtk({ vtkClass: inData[0].getClassName() });
      newDataSet.shallowCopy(inData[0]);
      newDataSet.getPointData().setScalars(da);
      outData[0] = newDataSet;
    }
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

fullScreenRenderer.addController(controlPanel);

// Warp setup
['scaleFactor'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    filter.set({ [propertyName]: value });
    renderWindow.render();
  });
});

// Checkbox
document.querySelector('.useNormal').addEventListener('change', (e) => {
  const useNormal = !!e.target.checked;
  filter.set({ useNormal });
  renderWindow.render();
});

// Sphere setup
['radius', 'thetaResolution', 'phiResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    sphereSource.set({ [propertyName]: value });
    renderWindow.render();
  });
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
