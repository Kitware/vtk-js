import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkRibbonFilter from '@kitware/vtk.js/Filters/Modeling/RibbonFilter';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';

import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

// Spiral parameters.
const nV = 256; // Number of vertices
const rS = 2; // Spiral radius
const nCyc = 3; // Number of helical cycles
const h = 10; // Height

const points = vtkPoints.newInstance();
let p = [0, 0, 0];
for (let i = 0; i < nV; i++) {
  const angle = (2 * Math.PI * nCyc * i) / (nV - 1);
  const vX = rS * Math.cos(angle);
  const vY = rS * Math.sin(angle);
  const vZ = (h * i) / nV;
  p = [vX, vY, vZ];
  points.insertPoint(i, p);
}

const v = [nV, ...Array.from({ length: nV }, (_, i) => i)];
const lines = vtkCellArray.newInstance({
  values: v,
});

const polyData = vtkPolyData.newInstance();
polyData.setPoints(points);
polyData.setLines(lines);

const lineActor = vtkActor.newInstance();
const lineMapper = vtkMapper.newInstance();
lineMapper.setInputData(polyData);
lineActor.setMapper(lineMapper);
lineActor.getProperty().setColor(1, 0, 0);
lineActor.getProperty().setLineWidth(3);

const ribbonFilter = vtkRibbonFilter.newInstance();
ribbonFilter.setInputData(polyData);

const ribbonActor = vtkActor.newInstance();
const ribbonMapper = vtkMapper.newInstance();
ribbonActor.setMapper(ribbonMapper);

ribbonMapper.setInputConnection(ribbonFilter.getOutputPort());

renderer.addActor(ribbonActor);
renderer.addActor(lineActor);
renderer.resetCamera();
renderWindow.render();
