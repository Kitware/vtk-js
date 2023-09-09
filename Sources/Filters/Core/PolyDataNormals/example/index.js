import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Glyph';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkArrowSource from '@kitware/vtk.js/Filters/Sources/ArrowSource';
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyDataNormals from '@kitware/vtk.js/Filters/Core/PolyDataNormals';

import controlPanel from './controlPanel.html';

const { ColorMode, ScalarMode } = vtkMapper;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.9, 0.9, 0.9],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const lookupTable = vtkLookupTable.newInstance({ hueRange: [0.666, 0] });

const source = vtkCubeSource.newInstance();
const inputPolyData = source.getOutputData();
inputPolyData.getPointData().setNormals(null);

const mapper = vtkMapper.newInstance({
  interpolateScalarsBeforeMapping: true,
  colorMode: ColorMode.DEFAULT,
  scalarMode: ScalarMode.DEFAULT,
  useLookupTableScalarRange: true,
  lookupTable,
});
const actor = vtkActor.newInstance();
actor.getProperty().setEdgeVisibility(true);

const polyDataNormals = vtkPolyDataNormals.newInstance();

// The generated 'z' array will become the default scalars, so the plane mapper will color by 'z':
polyDataNormals.setInputData(inputPolyData);

mapper.setInputConnection(polyDataNormals.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);

const arrowSource = vtkArrowSource.newInstance();

const glyphMapper = vtkGlyph3DMapper.newInstance();
glyphMapper.setInputConnection(polyDataNormals.getOutputPort());
glyphMapper.setSourceConnection(arrowSource.getOutputPort());
glyphMapper.setOrientationModeToDirection();
glyphMapper.setOrientationArray('Normals');
glyphMapper.setScaleModeToScaleByMagnitude();
glyphMapper.setScaleArray('Normals');
glyphMapper.setScaleFactor(0.1);

const glyphActor = vtkActor.newInstance();
glyphActor.setMapper(glyphMapper);
renderer.addActor(glyphActor);

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

// Checkbox
document
  .querySelector('.computePointNormals')
  .addEventListener('change', (e) => {
    polyDataNormals.setComputePointNormals(!!e.target.checked);
    renderWindow.render();
  });

document
  .querySelector('.computeCellNormals')
  .addEventListener('change', (e) => {
    polyDataNormals.setComputeCellNormals(!!e.target.checked);
    renderWindow.render();
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.mapper = mapper;
global.actor = actor;
global.source = source;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.lookupTable = lookupTable;
global.polyDataNormals = polyDataNormals;
global.glyphMapper = glyphMapper;
