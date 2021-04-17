import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import baseline from './testTubeColors.png';

function initializePolyData() {
  // Render a tapered cylinder with a color contour on its surface,
  // ranging from green at one end to red at the other end
  const numPoints = 2;
  const points = vtkPoints.newInstance();
  const polyData = vtkPolyData.newInstance();

  // Create a color array containing red and green
  const colorArray = vtkDataArray.newInstance({
    name: 'Colors',
    numberOfComponents: 3,
    values: Uint8Array.from([0, 255, 0, 255, 0, 0]),
  });

  // Create the tapered cylinder data
  let pointData = new Float32Array(3 * numPoints);
  let radiusData = new Float32Array(numPoints);
  let verts = new Uint32Array(2 * numPoints);
  let lines = new Uint32Array(numPoints + 1);

  // Cylinder axes from (0,0,0) to (12,0,0)
  pointData = [0.0, 0.0, 0.0, 12.0, 0.0, 0.0];

  // Taper cylinder radius from 1 to 3
  radiusData = [1.0, 3.0];

  verts = [1, 1, 1, 0];
  lines = [2, 0, 1];

  const radius = vtkDataArray.newInstance({
    name: 'Radius',
    values: radiusData,
  });

  // Create the polyData and assign it the data used for the cylinder
  points.setData(pointData);
  points.setNumberOfPoints(numPoints);
  polyData.setPoints(points);
  polyData.getVerts().setData(verts);
  polyData.getLines().setData(lines);

  // Add the radius and colorArray arrays to the pointData
  polyData.getPointData().addArray(radius);
  polyData.getPointData().addArray(colorArray);
  return polyData;
}

function getTubeFilter(polyData) {
  // Create a tubeFilter for the cylinder
  const tubeFilter = vtkTubeFilter.newInstance({ varyRadius: 3 });
  tubeFilter.setCapping(true);
  tubeFilter.setNumberOfSides(20);
  tubeFilter.setInputData(polyData);
  tubeFilter.setInputArrayToProcess(0, 'Radius', 'PointData');
  return tubeFilter;
}

function populateTubeMapper(tubeMapper, tubeFilter) {
  // Create the mapper, and assign it to setColorByArrayName
  tubeMapper.setInputConnection(tubeFilter.getOutputPort());
  tubeMapper.setColorByArrayName('Colors');
  tubeMapper.setScalarModeToUsePointFieldData();
  tubeMapper.setColorModeToDirectScalars();
  tubeMapper.set({
    scalarVisibility: true,
    interpolateScalarsBeforeMapping: false,
  });
}

test('Test vtkTubeFilter colorMapping', (t) => {
  const polyData = initializePolyData();

  const tubeFilter = getTubeFilter(polyData);

  const tubeOutput = tubeFilter.getOutputData();

  t.ok(
    tubeOutput.getPoints().getNumberOfPoints() === 80,
    'Make sure the output number of points is correct without capping.'
  );
  t.ok(
    tubeOutput.getPointData().getArrayByName('Radius').getData().length === 80,
    'Make sure the length of the radius array is correct.'
  );
  t.ok(
    tubeOutput.getPointData().getArrayByName('Colors').getData().length === 240,
    'Make sure the length of the color array is correct.'
  );
  const tubeMapper = vtkMapper.newInstance();
  populateTubeMapper(tubeMapper, tubeFilter);

  t.ok(
    tubeMapper.getColorByArrayName() === 'Colors',
    'Make sure the array name to color by is correct.'
  );
  t.ok(
    tubeMapper.getScalarModeAsString() === 'USE_POINT_FIELD_DATA',
    'Make sure the scalar mode is correct.'
  );
  t.ok(
    tubeMapper.getColorModeAsString() === 'DIRECT_SCALARS',
    'Make sure the color mode is correct.'
  );
  t.end();
});

test.onlyIfWebGL('Test vtkTubeFilter color map rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);

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

  const polyData = initializePolyData();
  const tubeFilter = getTubeFilter(polyData);

  const tubeMapper = gc.registerResource(vtkMapper.newInstance());
  populateTubeMapper(tubeMapper, tubeFilter);

  const tubeActor = gc.registerResource(vtkActor.newInstance());
  tubeActor.setMapper(tubeMapper);
  renderer.addActor(tubeActor);

  // Create the renderer and display the colored tube
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
      'Filters/General/TubeFilter/testTubeColors',
      t,
      2.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
