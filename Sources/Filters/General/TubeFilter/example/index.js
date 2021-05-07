import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import Constants from 'vtk.js/Sources/Filters/General/TubeFilter/Constants';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';

import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

import controlPanel from './controlPanel.html';

const { VaryRadius } = Constants;

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

function addRepresentation(name, filter, props = {}) {
  const mapper = vtkMapper.newInstance();
  if (filter.isA('vtkPolyData')) {
    mapper.setInputData(filter);
  } else {
    mapper.setInputConnection(filter.getOutputPort());
  }

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().set(props);
  renderer.addActor(actor);

  global[`${name}Actor`] = actor;
  global[`${name}Mapper`] = mapper;
}

vtkMath.randomSeed(15222);
const numSegments = 3;

function initializePolyData(dType) {
  let pointType = VtkDataTypes.FLOAT;
  if (dType === DesiredOutputPrecision.SINGLE) {
    pointType = VtkDataTypes.FLOAT;
  } else if (dType === DesiredOutputPrecision.DOUBLE) {
    pointType = VtkDataTypes.DOUBLE;
  }
  const polyData = vtkPolyData.newInstance();
  const points = vtkPoints.newInstance({ dataType: pointType });
  points.setNumberOfPoints(numSegments + 1);
  const pointData = new Float32Array(3 * (numSegments + 1));
  const verts = new Uint32Array(2 * (numSegments + 1));
  const lines = new Uint32Array(numSegments + 2);
  lines[0] = numSegments + 1;
  const scalarsData = new Float32Array(numSegments + 1);
  const scalars = vtkDataArray.newInstance({
    name: 'Scalars',
    values: scalarsData,
  });

  for (let i = 0; i < numSegments + 1; ++i) {
    for (let j = 0; j < 3; ++j) {
      pointData[3 * i + j] = vtkMath.random();
    }
    scalarsData[i] = i * 0.1;
    verts[i] = 1;
    verts[i + 1] = i;
    lines[i + 1] = i;
  }

  points.setData(pointData);
  polyData.setPoints(points);
  polyData.getVerts().setData(verts);
  polyData.getLines().setData(lines);
  polyData.getPointData().setScalars(scalars);
  return polyData;
}

// ----------------------------------------------------------------------------

const polyData = initializePolyData(DesiredOutputPrecision.DOUBLE);
const tubeFilter = vtkTubeFilter.newInstance();
tubeFilter.setCapping(false);
tubeFilter.setNumberOfSides(50);
tubeFilter.setRadius(0.1);

tubeFilter.setInputData(polyData);
tubeFilter.setInputArrayToProcess(0, 'Scalars', 'PointData', 'Scalars');

addRepresentation('polyData', polyData, {});
addRepresentation('tubeFilter', tubeFilter, {});

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['numberOfSides', 'radius', 'onRatio'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    tubeFilter.set({ [propertyName]: value });
    renderWindow.render();
  });
});

document.querySelector('.varyRadius').addEventListener('change', (e) => {
  const value = e.target.value;
  tubeFilter.set({ varyRadius: VaryRadius[value] });
  renderWindow.render();
});

document.querySelector('.capping').addEventListener('change', (e) => {
  const capping = !!e.target.checked;
  tubeFilter.set({ capping });
  renderWindow.render();
});

document.querySelector('.tubing').addEventListener('change', (e) => {
  const tubing = !!e.target.checked;
  global.tubeFilterActor.setVisibility(tubing);
  renderWindow.render();
});

// // ----- Console play ground -----
// global.pointSource = pointSource;
global.tubeFilter = tubeFilter;
global.renderer = renderer;
global.renderWindow = renderWindow;
