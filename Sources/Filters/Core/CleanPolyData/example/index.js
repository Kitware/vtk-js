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

const finalPolyData = cleanPolyData.getOutputData();
const finalPoints = finalPolyData.getNumberOfPoints();
const finalCells = finalPolyData.getNumberOfCells();
const finalLines = finalPolyData.getLines().getNumberOfCells();
const finalPolys = finalPolyData.getPolys().getNumberOfCells();
const finalStrips = finalPolyData.getStrips().getNumberOfCells();

const gui = new GUI();
const beforeFolder = gui.addFolder('Before(Left Cube)');
const afterFolder = gui.addFolder('After(Right Cube)');

beforeFolder
  .add({ initialPoints }, 'initialPoints')
  .name(`Initial points`)
  .listen()
  .disable();
beforeFolder
  .add({ initialCells }, 'initialCells')
  .name(`Initial cells`)
  .listen()
  .disable();
beforeFolder
  .add({ initialLines }, 'initialLines')
  .name(`Initial lines`)
  .listen()
  .disable();
beforeFolder
  .add({ initialPolys }, 'initialPolys')
  .name(`Initial polys`)
  .listen()
  .disable();
beforeFolder
  .add({ initialStrips }, 'initialStrips')
  .name(`Initial strips`)
  .listen()
  .disable();

afterFolder
  .add({ finalPoints }, 'finalPoints')
  .name(`Final points`)
  .listen()
  .disable();
afterFolder
  .add({ finalCells }, 'finalCells')
  .name(`Final cells`)
  .listen()
  .disable();
afterFolder
  .add({ finalLines }, 'finalLines')
  .name(`Final lines`)
  .listen()
  .disable();
afterFolder
  .add({ finalPolys }, 'finalPolys')
  .name(`Final polys`)
  .listen()
  .disable();
afterFolder
  .add({ finalStrips }, 'finalStrips')
  .name(`Final strips`)
  .listen()
  .disable();
