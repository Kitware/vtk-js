import 'vtk.js/Sources/favicon';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkCutter from 'vtk.js/Sources/Filters/Core/Cutter';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';

import controlPanel from './controlPanel.html';

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

const plane = vtkPlane.newInstance();
const cube = vtkCubeSource.newInstance();

const cutter = vtkCutter.newInstance();
cutter.setCutFunction(plane);
cutter.setInputConnection(cube.getOutputPort());

const cutMapper = vtkMapper.newInstance();
cutMapper.setInputConnection(cutter.getOutputPort());
const cutActor = vtkActor.newInstance();
cutActor.setMapper(cutMapper);
const cutProperty = cutActor.getProperty();
cutProperty.setRepresentation(vtkProperty.Representation.WIREFRAME);
cutProperty.setLighting(false);
cutProperty.setColor(0, 1, 0);
renderer.addActor(cutActor);

const cubeMapper = vtkMapper.newInstance();
cubeMapper.setInputConnection(cube.getOutputPort());
const cubeActor = vtkActor.newInstance();
cubeActor.setMapper(cubeMapper);
const cubeProperty = cubeActor.getProperty();
cubeProperty.setRepresentation(vtkProperty.Representation.WIREFRAME);
cubeProperty.setLighting(false);
renderer.addActor(cubeActor);

renderer.resetCamera();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

const state = {
  originX: 0,
  originY: 0,
  originZ: 0,
  normalX: 1,
  normalY: 0,
  normalZ: 0,
};

const updatePlaneFunction = () => {
  plane.setOrigin(state.originX, state.originY, state.originZ);
  plane.setNormal(state.normalX, state.normalY, state.normalZ);
  renderWindow.render();
};

// Update now
updatePlaneFunction();

// Update when changing UI
['originX', 'originY', 'originZ', 'normalX', 'normalY', 'normalZ'].forEach(
  (propertyName) => {
    const elem = document.querySelector(`.${propertyName}`);
    elem.addEventListener('input', (e) => {
      const value = Number(e.target.value);
      state[propertyName] = value;
      updatePlaneFunction();
    });
  }
);
