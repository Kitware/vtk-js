import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import Constants from '@kitware/vtk.js/Filters/General/TubeFilter/Constants';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import * as vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkTubeFilter from '@kitware/vtk.js/Filters/General/TubeFilter';

import { DesiredOutputPrecision } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from '@kitware/vtk.js/Common/Core/DataArray/Constants';

import GUI from 'lil-gui';

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

const gui = new GUI();
const params = {
  tubing: true,
  numberOfSides: 50,
  radius: 0.1,
  varyRadius: 'VARY_RADIUS_OFF',
  capping: false,
  onRatio: 1,
};

gui
  .add(params, 'tubing')
  .name('Tubing')
  .onChange((value) => {
    global.tubeFilterActor.setVisibility(!!value);
    renderWindow.render();
  });

gui
  .add(params, 'numberOfSides', 3, 100, 1)
  .name('Number of sides')
  .onChange((value) => {
    tubeFilter.set({ numberOfSides: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'radius', 0.01, 1.0, 0.01)
  .name('Radius')
  .onChange((value) => {
    tubeFilter.set({ radius: Number(value) });
    renderWindow.render();
  });

gui
  .add(params, 'varyRadius', [
    'VARY_RADIUS_OFF',
    'VARY_RADIUS_BY_SCALAR',
    'VARY_RADIUS_BY_VECTOR',
    'VARY_RADIUS_BY_ABSOLUTE_SCALAR',
  ])
  .name('Vary radius')
  .onChange((value) => {
    tubeFilter.set({ varyRadius: VaryRadius[value] });
    renderWindow.render();
  });

gui
  .add(params, 'capping')
  .name('Capping')
  .onChange((value) => {
    tubeFilter.set({ capping: !!value });
    renderWindow.render();
  });

gui
  .add(params, 'onRatio', 1, 4, 1)
  .name('OnRatio')
  .onChange((value) => {
    tubeFilter.set({ onRatio: Number(value) });
    renderWindow.render();
  });

// // ----- Console play ground -----
// global.pointSource = pointSource;
global.tubeFilter = tubeFilter;
global.renderer = renderer;
global.renderWindow = renderWindow;
