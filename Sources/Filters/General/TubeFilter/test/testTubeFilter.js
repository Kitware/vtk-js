import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';

import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { VaryRadius } from 'vtk.js/Sources/Filters/General/TubeFilter/Constants';

import baseline from './testTubeFilter.png';

test('Test vtkTubeFilter instance', (t) => {
  t.ok(vtkTubeFilter, 'Make sure the class definition exists.');
  const instance = vtkTubeFilter.newInstance();
  t.ok(instance, 'Make sure an instance can be created.');
  t.end();
});

const numSegments = 3;

function initializePolyData(dType) {
  const seed = 15322;
  if (vtkMath.getSeed() !== seed) {
    vtkMath.randomSeed(seed);
  }
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

test('Test vtkTubeFilter execution', (t) => {
  const polyData = initializePolyData(DesiredOutputPrecision.DOUBLE);

  const tubeFilter1 = vtkTubeFilter.newInstance({
    outputPointsPrecision: DesiredOutputPrecision.DOUBLE,
    capping: false,
    numberOfSides: 3,
  });
  tubeFilter1.setInputData(polyData);
  const tubeOutput1 = tubeFilter1.getOutputData();
  t.ok(
    tubeOutput1.getPoints().getDataType() === VtkDataTypes.DOUBLE,
    'Make sure the output data type is double.'
  );
  t.ok(
    tubeOutput1.getPoints().getNumberOfPoints() === 12,
    'Make sure the output number of points is correct without capping.'
  );
  t.ok(
    tubeOutput1.getPointData().getNormals().getNumberOfTuples() === 12,
    'Make sure the output number of normals is correct without capping.'
  );

  const tubeFilter2 = vtkTubeFilter.newInstance({
    outputPointsPrecision: DesiredOutputPrecision.SINGLE,
    capping: true,
    numberOfSides: 3,
  });
  tubeFilter2.setInputData(polyData);
  const tubeOutput2 = tubeFilter2.getOutputData();
  t.ok(
    tubeOutput2.getPoints().getDataType() === VtkDataTypes.FLOAT,
    'Make sure the output data type is float.'
  );
  t.ok(
    tubeOutput2.getPoints().getNumberOfPoints() === 18,
    'Make sure the output number of points is correct with capping.'
  );
  t.ok(
    tubeOutput2.getPointData().getNormals().getNumberOfTuples() === 18,
    'Make sure the output number of normals is correct with capping.'
  );
  t.end();
});

test.onlyIfWebGL('Test vtkTubeFilter rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkTubeFilter Rendering');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const polyData = initializePolyData(DesiredOutputPrecision.DOUBLE);
  const tubeFilter = vtkTubeFilter.newInstance();
  tubeFilter.setCapping(false);
  tubeFilter.setNumberOfSides(50);
  tubeFilter.setRadius(0.05);
  tubeFilter.setVaryRadius(VaryRadius.VARY_RADIUS_BY_SCALAR);

  tubeFilter.setInputData(polyData);
  tubeFilter.setInputArrayToProcess(0, 'Scalars', 'PointData', 'Scalars');
  mapper.setInputConnection(tubeFilter.getOutputPort());
  mapper.set({
    colorByArrayName: 'Scalars',
    colorMode: ColorMode.MAP_SCALARS,
    interpolateScalarsBeforeMapping: true,
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
    scalarVisibility: true,
  });

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const camera = renderer.getActiveCamera();
  camera.yaw(40);
  renderer.resetCamera();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Filters/General/TubeFilter/testTubeFilter',
      t,
      2.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
