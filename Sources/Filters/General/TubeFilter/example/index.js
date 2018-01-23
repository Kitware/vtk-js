import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
// import vtkPointSource             from 'vtk.js/Sources/Filters/Sources/PointSource';
// import vtkOutlineFilter           from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath                    from 'vtk.js/Sources/Common/Core/Math';
import vtkTubeFilter              from 'vtk.js/Sources/Filters/General/TubeFilter';
import vtkPoints                  from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData                from 'vtk.js/Sources/Common/DataModel/PolyData';
import { VtkPointPrecision }         from 'vtk.js/Sources/Filters/General/Constants';
import { VtkDataTypes }           from 'vtk.js/Sources/Common/Core/DataArray/Constants';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0, 0, 0] });
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

vtkMath.randomSeed(1);
const numSegments = 2;

function initializePolyData(dType) {
  let pointType = VtkDataTypes.FLOAT;
  if (dType === VtkPointPrecision.SINGLE) {
    pointType = VtkDataTypes.FLOAT;
  } else if (dType === VtkPointPrecision.DOUBLE) {
    pointType = VtkDataTypes.DOUBLE;
  }
  const polyData = vtkPolyData.newInstance();
  const points = vtkPoints.newInstance({ dataType: pointType });
  points.setNumberOfPoints(numSegments + 1);
  // const pointData = points.getData();
  const verts = new Uint32Array(2 * (numSegments + 1));
  const lines = new Uint32Array(numSegments + 2);
  lines[0] = numSegments + 1;

  const pointData = [0, 0, 0, -0.13, -0.51, 0, -0.41, -0.48, 0];
  points.setData(pointData);
  for (let i = 0; i < (numSegments + 1); ++i) {
//    for (let j = 0; j < 3; ++j) {
//      pointData[(3 * i) + j] = Math.random();
//    }
    verts[i] = 1;
    verts[i + 1] = i;
    lines[i + 1] = i;
  }

  polyData.setPoints(points);
  // polyData.getVerts().setData(verts);
  polyData.getLines().setData(lines);
  return polyData;
}

// ----------------------------------------------------------------------------


// const pointSource = vtkPointSource.newInstance({ numberOfPoints: 25, radius: 0.25 });
const polyData = initializePolyData(VtkPointPrecision.DOUBLE);
const tubeFilter = vtkTubeFilter.newInstance();
tubeFilter.setCapping(true);
tubeFilter.setNumberOfSides(30);
tubeFilter.setRadius(0.083);
tubeFilter.setRadiusFactor(10);

tubeFilter.setInputData(polyData);

addRepresentation('polyData', polyData, {});
// addRepresentation('pointSource', pointSource, { pointSize: 5 });
addRepresentation('tubeFilter', tubeFilter, {});

renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

// ['numberOfPoints', 'radius'].forEach((propertyName) => {
//   document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
//     const value = Number(e.target.value);
//     pointSource.set({ [propertyName]: value });
//     renderWindow.render();
//   });
// });

// // ----- Console play ground -----
// global.pointSource = pointSource;
global.tubeFilter = tubeFilter;
global.renderer = renderer;
global.renderWindow = renderWindow;
