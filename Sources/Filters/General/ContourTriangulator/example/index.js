import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkContourTriangulator from 'vtk.js/Sources/Filters/General/ContourTriangulator';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

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

const source = vtkPolyData.newInstance();
// Generate a ring of points
const nbPoints = 16;
const points = vtkPoints.newInstance({
  size: nbPoints * 3,
});
source.setPoints(points);
const lines = vtkCellArray.newInstance();
source.setLines(lines);

for (let i = 0; i < nbPoints; i++) {
  const phi = (i * (2 * Math.PI)) / nbPoints;
  points.setPoint(i, Math.cos(phi), Math.sin(phi), 0);

  // Connect points with lines
  if (i === nbPoints - 1) {
    lines.insertNextCell([i, 0]);
  } else {
    lines.insertNextCell([i, i + 1]);
  }
}

// Build pipeline
const filter = vtkContourTriangulator.newInstance();
filter.setInputData(source);
filter.update();
const filterData = filter.getOutputData();

mapper.setInputData(filterData);

// -----------------------------------------------------------

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = source;
global.filter = filter;
global.filterData = filterData;
global.mapper = mapper;
global.actor = actor;
