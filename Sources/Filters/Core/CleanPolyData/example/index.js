import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCleanPolyData from '@kitware/vtk.js/Filters/Core/CleanPolyData';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkArrowSource from '@kitware/vtk.js/Filters/Sources/ArrowSource';

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

const cubeSource1 = vtkCubeSource.newInstance();
const cubeActor1 = vtkActor.newInstance();
const cubeMapper1 = vtkMapper.newInstance();
cubeActor1.setMapper(cubeMapper1);
cubeMapper1.setInputConnection(cubeSource1.getOutputPort());
renderer.addActor(cubeActor1);

const arrowSource1 = vtkArrowSource.newInstance();
const glyphMapper1 = vtkGlyph3DMapper.newInstance();
glyphMapper1.setInputConnection(cubeSource1.getOutputPort());
glyphMapper1.setSourceConnection(arrowSource1.getOutputPort());
glyphMapper1.setOrientationModeToDirection();
glyphMapper1.setOrientationArray('Normals');
glyphMapper1.setScaleModeToScaleByMagnitude();
glyphMapper1.setScaleArray('Normals');
glyphMapper1.setScaleFactor(0.1);

const glyphActor1 = vtkActor.newInstance();
glyphActor1.setMapper(glyphMapper1);
renderer.addActor(glyphActor1);

const cubeSource2 = vtkCubeSource.newInstance();
const cubeActor2 = vtkActor.newInstance();
const cubeMapper2 = vtkMapper.newInstance();

cubeActor2.setMapper(cubeMapper2);
cubeMapper2.setInputConnection(cubeSource2.getOutputPort());
cubeActor2.setPosition(2, 0, 0);
renderer.addActor(cubeActor2);

const cleanPolyData = vtkCleanPolyData.newInstance();
cleanPolyData.setInputConnection(cubeSource2.getOutputPort());

const arrowSource2 = vtkArrowSource.newInstance();
const glyphMapper2 = vtkGlyph3DMapper.newInstance();
glyphMapper2.setInputConnection(cleanPolyData.getOutputPort());
glyphMapper2.setSourceConnection(arrowSource2.getOutputPort());
glyphMapper2.setOrientationModeToDirection();
glyphMapper2.setOrientationArray('Normals');
glyphMapper2.setScaleModeToScaleByMagnitude();
glyphMapper2.setScaleArray('Normals');
glyphMapper2.setScaleFactor(0.1);

const glyphActor2 = vtkActor.newInstance();
glyphActor2.setMapper(glyphMapper2);
glyphActor2.setPosition(2, 0, 0);
renderer.addActor(glyphActor2);

// --- Render ---
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Display initial and final polydata stats
// -----------------------------------------------------------
const initialPolyData = cubeSource1.getOutputData();
const initialPoints = initialPolyData.getNumberOfPoints();
const initialCells = initialPolyData.getNumberOfCells();
const initialLines = initialPolyData.getLines().getNumberOfCells();
const initialPolys = initialPolyData.getPolys().getNumberOfCells();
const initialStrips = initialPolyData.getStrips().getNumberOfCells();

document.querySelector('.initial-points').textContent = initialPoints;
document.querySelector('.initial-cells').textContent = initialCells;
document.querySelector('.initial-lines').textContent = initialLines;
document.querySelector('.initial-polys').textContent = initialPolys;
document.querySelector('.initial-strips').textContent = initialStrips;

const finalPolyData = cleanPolyData.getOutputData();
const finalPoints = finalPolyData.getNumberOfPoints();
const finalCells = finalPolyData.getNumberOfCells();
const finalLines = finalPolyData.getLines().getNumberOfCells();
const finalPolys = finalPolyData.getPolys().getNumberOfCells();
const finalStrips = finalPolyData.getStrips().getNumberOfCells();

document.querySelector('.final-points').textContent = finalPoints;
document.querySelector('.final-cells').textContent = finalCells;
document.querySelector('.final-lines').textContent = finalLines;
document.querySelector('.final-polys').textContent = finalPolys;
document.querySelector('.final-strips').textContent = finalStrips;
