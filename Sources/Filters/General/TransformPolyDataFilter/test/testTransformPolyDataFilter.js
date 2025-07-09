import test from 'tape';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';
import vtkTransformPolyDataFilter from 'vtk.js/Sources/Filters/General/TransformPolyDataFilter';
import { DesiredOutputPrecision } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

// Helper function to create a test polydata
function createTestPolyData() {
  const polyData = vtkPolyData.newInstance();

  // Create points (a simple triangle)
  const points = vtkPoints.newInstance();
  points.setData(
    Float32Array.from([
      0.0,
      0.0,
      0.0, // point 0
      1.0,
      0.0,
      0.0, // point 1
      0.5,
      1.0,
      0.0, // point 2
    ])
  );
  polyData.setPoints(points);

  // Create a triangle polygon
  const polys = vtkCellArray.newInstance({
    values: [3, 0, 1, 2], // triangle with 3 points: 0, 1, 2
  });
  polyData.setPolys(polys);

  // add lines & polys for testing
  const lines = vtkCellArray.newInstance({
    values: [2, 0, 1, 2, 1, 2], // two lines: 0-1 and 1-2
  });
  polyData.setLines(lines);

  const verts = vtkCellArray.newInstance({
    values: [1, 0, 1, 2], // two vertices: 0 and 1
  });
  polyData.setVerts(verts);

  const pointData = polyData.getPointData();
  // Add vectors pointing in Z direction
  const vectors = vtkDataArray.newInstance({
    name: 'TestVectors',
    numberOfComponents: 3,
    dataType: VtkDataTypes.FLOAT,
    values: [
      0.0,
      0.0,
      1.0, // vector for point 0
      0.0,
      0.0,
      1.0, // vector for point 1
      0.0,
      0.0,
      1.0, // vector for point 2
    ],
  });
  pointData.setVectors(vectors);

  // Add normals pointing in Z direction
  const normals = vtkDataArray.newInstance({
    name: 'TestNormals',
    numberOfComponents: 3,
    dataType: VtkDataTypes.FLOAT,
    values: [
      0.0,
      0.0,
      1.0, // normal for point 0
      0.0,
      0.0,
      1.0, // normal for point 1
      0.0,
      0.0,
      1.0, // normal for point 2
    ],
  });
  pointData.setNormals(normals);

  return polyData;
}

// Test identity transform (no change)
test('Test vtkTransformPolyDataFilter with Identity transform', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  // Create identity transform
  const transform = vtkTransform.newInstance();
  filter.setTransform(transform);

  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();
  const inputPoints = inputData.getPoints().getData();
  const outputPoints = output.getPoints().getData();

  t.ok(
    vtkMath.areEquals(inputPoints, outputPoints),
    'Points should be unchanged with identity transform'
  );
  t.equal(
    output.getNumberOfPoints(),
    inputData.getNumberOfPoints(),
    'Number of points should be preserved'
  );
  t.equal(
    output.getNumberOfCells(),
    inputData.getNumberOfCells(),
    'Number of cells should be preserved'
  );

  // Check that vectors are correctly preserved
  const inputVectors = inputData.getPointData().getVectors().getData();
  const outputVectors = output.getPointData().getVectors().getData();
  t.ok(
    vtkMath.areEquals(inputVectors, outputVectors),
    'Vectors should be unchanged with identity transform'
  );

  // Check that normals are correctly preserved
  const inputNormals = inputData.getPointData().getNormals().getData();
  const outputNormals = output.getPointData().getNormals().getData();
  t.ok(
    vtkMath.areEquals(inputNormals, outputNormals),
    'Normals should be unchanged with identity transform'
  );

  t.end();
});

// Test translation transform
test('Test vtkTransformPolyDataFilter with translation transform', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  // Create translation transform
  const transform = vtkTransform.newInstance();
  transform.translate(1, 2, 3);

  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();
  const outputPoints = output.getPoints().getData();

  // Check that points are translated correctly
  const expectedPoints = [
    1.0,
    2.0,
    3.0, // (0,0,0) + (1,2,3)
    2.0,
    2.0,
    3.0, // (1,0,0) + (1,2,3)
    1.5,
    3.0,
    3.0, // (0.5,1,0) + (1,2,3)
  ];

  t.ok(
    vtkMath.areEquals(outputPoints, expectedPoints),
    'Points should be translated correctly'
  );

  // Check that vectors remain unchanged after translation
  const outputVectors = output.getPointData().getVectors().getData();
  const expectedVector = [0.0, 0.0, 1.0];
  t.ok(
    vtkMath.areEquals(outputVectors.slice(0, 3), expectedVector),
    'First vector should remain unchanged after translation'
  );

  // Check that normals remain unchanged after translation
  const outputNormals = output.getPointData().getNormals().getData();
  const expectedNormal = [0.0, 0.0, 1.0];
  t.ok(
    vtkMath.areEquals(outputNormals.slice(0, 3), expectedNormal),
    'First normal should remain unchanged after translation'
  );
  t.end();
});

// Test rotation transform
test('Test vtkTransformPolyDataFilter with rotation transform', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  // Create 90-degree rotation around Z-axis
  const transform = vtkTransform.newInstance();
  transform.rotateZ(90);

  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();
  const outputPoints = output.getPoints().getData();

  // After 90-degree rotation around Z: (x,y,z) -> (-y,x,z)
  const expectedPoints = [
    0.0,
    0.0,
    0.0, // (0,0,0) -> (0,0,0)
    0.0,
    1.0,
    0.0, // (1,0,0) -> (0,1,0)
    -1.0,
    0.5,
    0.0, // (0.5,1,0) -> (-1,0.5,0)
  ];

  t.ok(
    vtkMath.areEquals(outputPoints, expectedPoints),
    'Points should be rotated correctly'
  );

  // Check one vector and one normal after rotation
  const outputVectors = output.getPointData().getVectors().getData();
  const outputNormals = output.getPointData().getNormals().getData();

  // After 90-degree Z rotation, vectors and normals pointing in Z remain unchanged
  const expectedVector = [0.0, 0.0, 1.0];
  const expectedNormal = [0.0, 0.0, 1.0];

  t.ok(
    vtkMath.areEquals(outputVectors.slice(0, 3), expectedVector),
    'First vector should remain unchanged after Z rotation'
  );
  t.ok(
    vtkMath.areEquals(outputNormals.slice(0, 3), expectedNormal),
    'First normal should remain unchanged after Z rotation'
  );
  t.end();
});

// Test scaling transform
test('Test vtkTransformPolyDataFilter with scaling transform', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  // Create non-uniform scaling transform
  const transform = vtkTransform.newInstance();
  transform.scale(2, 3, 4);

  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();
  const outputPoints = output.getPoints().getData();

  // Points should be scaled by (2,3,4)
  const expectedPoints = [
    0.0,
    0.0,
    0.0, // (0,0,0)
    2.0,
    0.0,
    0.0, // (1,0,0) scaled
    1.0,
    3.0,
    0.0, // (0.5,1,0) scaled
  ];
  t.ok(
    vtkMath.areEquals(outputPoints, expectedPoints),
    'Points should be scaled correctly'
  );

  // Check transformed vectors
  const outputVectors = output.getPointData().getVectors().getData();
  const actualVector = outputVectors.slice(0, 3);
  const expectedVector = [0.0, 0.0, 4.0]; // Z component scaled by 4
  t.ok(
    vtkMath.areEquals(actualVector, expectedVector),
    `First vector should be scaled correctly: expected [${expectedVector}], got [${actualVector}]`
  );

  // Check transformed normals
  const outputNormals = output.getPointData().getNormals().getData();
  const actualNormal = outputNormals.slice(0, 3);
  const expectedNormal = [0.0, 0.0, 1];
  t.ok(
    vtkMath.areEquals(actualNormal, expectedNormal),
    `First normal should be transformed via inverse-transpose: expected [${expectedNormal}], got [${actualNormal}]`
  );

  t.end();
});

// Test output precision settings
test('Test vtkTransformPolyDataFilter with output precision', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  const transform = vtkTransform.newInstance();
  // Test single precision
  filter.setOutputPointsPrecision(DesiredOutputPrecision.SINGLE);
  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();
  let output = filter.getOutputData();
  t.equal(
    output.getPoints().getDataType(),
    VtkDataTypes.FLOAT,
    'Single precision should use FLOAT'
  );

  // Test double precision
  filter.setOutputPointsPrecision(DesiredOutputPrecision.DOUBLE);
  filter.update();
  output = filter.getOutputData();
  t.equal(
    output.getPoints().getDataType(),
    VtkDataTypes.DOUBLE,
    'Double precision should use DOUBLE'
  );

  t.end();
});

// Test empty input handling
test('Test vtkTransformPolyDataFilter with empty input', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const emptyData = vtkPolyData.newInstance();

  const transform = vtkTransform.newInstance();
  filter.setTransform(transform);
  filter.setInputData(emptyData);
  filter.update();

  const output = filter.getOutputData();
  t.equal(
    output.getNumberOfPoints(),
    0,
    'Empty input should produce empty output'
  );

  t.end();
});

// Test topology preservation
test('Test vtkTransformPolyDataFilter with topology preservation', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  const transform = vtkTransform.newInstance();
  transform.translate(1, 1, 1);

  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();

  // Check that topology is preserved
  const inputPolys = inputData.getPolys().getData();
  const outputPolys = output.getPolys().getData();

  t.ok(
    vtkMath.areEquals(inputPolys, outputPolys),
    'Polygon topology should be preserved'
  );
  t.end();
});

// Test transform with vectors and normals
test('Test vtkTransformPolyDataFilter with vectors and normals transformation', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  // Create 90-degree rotation around X-axis
  const transform = vtkTransform.newInstance();
  transform.rotateX(90);

  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();
  const outputPointData = output.getPointData();

  // Check that vectors and normals are present
  t.ok(outputPointData.getVectors(), 'Output should have vectors');
  t.ok(outputPointData.getNormals(), 'Output should have normals');

  // After 90-degree rotation around X: (x,y,z) -> (x,-z,y)
  // So (0,0,1) -> (0,-1,0)
  const outputVectors = outputPointData.getVectors().getData();
  const expectedVectors = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];

  t.ok(
    vtkMath.areEquals(outputVectors, expectedVectors),
    'Vectors should be transformed correctly'
  );

  const outputNormals = outputPointData.getNormals().getData();

  const expectedNormals = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];
  t.ok(
    vtkMath.areEquals(outputNormals, expectedNormals),
    'Normals should be transformed correctly'
  );

  t.end();
});

// Test transform with cell vectors and cell normals
test('Test vtkTransformPolyDataFilter with cell normals and vectors transformation', (t) => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  // Add cell vectors and normals
  const cellData = inputData.getCellData();

  const cellVectors = vtkDataArray.newInstance({
    name: 'CellVectors',
    numberOfComponents: 3,
    dataType: VtkDataTypes.FLOAT,
    values: Float32Array.from([
      0.0,
      0.0,
      1.0, // vector for cell 0
      0.0,
      0.0,
      1.0, // vector for cell 1
      0.0,
      0.0,
      1.0, // vector for cell 2
    ]),
  });
  cellData.setVectors(cellVectors);

  const cellNormals = vtkDataArray.newInstance({
    name: 'CellNormals',
    numberOfComponents: 3,
    dataType: VtkDataTypes.FLOAT,
    values: Float32Array.from([
      0.0,
      0.0,
      1.0, // normal for cell 0
      0.0,
      0.0,
      1.0, // normal for cell 1
      0.0,
      0.0,
      1.0, // normal for cell 2
    ]),
  });
  cellData.setNormals(cellNormals);

  // Create 90-degree rotation around X-axis
  const transform = vtkTransform.newInstance();
  transform.rotateX(90);

  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();

  const output = filter.getOutputData();
  const outputCellData = output.getCellData();

  // Verify cell vectors and normals exist
  t.ok(outputCellData.getVectors(), 'Output should have cell vectors');
  t.ok(outputCellData.getNormals(), 'Output should have cell normals');

  // After 90-degree X rotation: (x,y,z) -> (x,-z,y)
  // So (0,0,1) -> (0,-1,0)
  const outputCellVectors = outputCellData.getVectors().getData();
  const expectedCellVectors = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];

  t.ok(
    vtkMath.areEquals(outputCellVectors, expectedCellVectors),
    'Cell vectors should be transformed correctly'
  );

  const outputCellNormals = outputCellData.getNormals().getData();
  const expectedCellNormals = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];

  t.ok(
    vtkMath.areEquals(outputCellNormals, expectedCellNormals),
    'Cell normals should be transformed correctly'
  );

  t.end();
});
