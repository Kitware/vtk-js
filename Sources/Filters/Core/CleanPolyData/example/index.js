import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCleanPolyData from '@kitware/vtk.js/Filters/Core/CleanPolyData';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const cleanPolyData = vtkCleanPolyData.newInstance();

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cubeSource = vtkCubeSource.newInstance();
mapper.setInputConnection(cleanPolyData.getOutputPort());

cleanPolyData.setInputConnection(cubeSource.getOutputPort());

// Update the control panel with initial values
const initialPoints = cubeSource.getOutputData().getNumberOfPoints();
const initialCells = cubeSource.getOutputData().getNumberOfCells();
const initialLines = cubeSource.getOutputData().getLines().getNumberOfCells();
const initialPolys = cubeSource.getOutputData().getPolys().getNumberOfCells();
const initialStrips = cubeSource.getOutputData().getStrips().getNumberOfCells();
document.querySelector('.initial-points').textContent = initialPoints;
document.querySelector('.initial-cells').textContent = initialCells;
document.querySelector('.initial-lines').textContent = initialLines;
document.querySelector('.initial-polys').textContent = initialPolys;
document.querySelector('.initial-strips').textContent = initialStrips;

const finalPoints = cleanPolyData.getOutputData().getNumberOfPoints();
const finalCells = cleanPolyData.getOutputData().getNumberOfCells();
const finalLines = cleanPolyData.getOutputData().getLines().getNumberOfCells();
const finalPolys = cleanPolyData.getOutputData().getPolys().getNumberOfCells();
const finalStrips = cleanPolyData
  .getOutputData()
  .getStrips()
  .getNumberOfCells();
document.querySelector('.final-points').textContent = finalPoints;
document.querySelector('.final-cells').textContent = finalCells;
document.querySelector('.final-lines').textContent = finalLines;
document.querySelector('.final-polys').textContent = finalPolys;
document.querySelector('.final-strips').textContent = finalStrips;

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
