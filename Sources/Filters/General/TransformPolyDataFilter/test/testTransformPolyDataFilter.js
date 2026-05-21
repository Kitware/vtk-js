import { it, expect } from 'vitest';
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
it('Test vtkTransformPolyDataFilter with Identity transform', () => {
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

  expect(
    vtkMath.areEquals(inputPoints, outputPoints),
    'Points should be unchanged with identity transform'
  ).toBeTruthy();
  expect(
    output.getNumberOfPoints(),
    'Number of points should be preserved'
  ).toBe(inputData.getNumberOfPoints());
  expect(output.getNumberOfCells(), 'Number of cells should be preserved').toBe(
    inputData.getNumberOfCells()
  );

  // Check that vectors are correctly preserved
  const inputVectors = inputData.getPointData().getVectors().getData();
  const outputVectors = output.getPointData().getVectors().getData();
  expect(
    vtkMath.areEquals(inputVectors, outputVectors),
    'Vectors should be unchanged with identity transform'
  ).toBeTruthy();

  // Check that normals are correctly preserved
  const inputNormals = inputData.getPointData().getNormals().getData();
  const outputNormals = output.getPointData().getNormals().getData();
  expect(
    vtkMath.areEquals(inputNormals, outputNormals),
    'Normals should be unchanged with identity transform'
  ).toBeTruthy();
});

// Test translation transform
it('Test vtkTransformPolyDataFilter with translation transform', () => {
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

  expect(
    vtkMath.areEquals(outputPoints, expectedPoints),
    'Points should be translated correctly'
  ).toBeTruthy();

  // Check that vectors remain unchanged after translation
  const outputVectors = output.getPointData().getVectors().getData();
  const expectedVector = [0.0, 0.0, 1.0];
  expect(
    vtkMath.areEquals(outputVectors.slice(0, 3), expectedVector),
    'First vector should remain unchanged after translation'
  ).toBeTruthy();

  // Check that normals remain unchanged after translation
  const outputNormals = output.getPointData().getNormals().getData();
  const expectedNormal = [0.0, 0.0, 1.0];
  expect(
    vtkMath.areEquals(outputNormals.slice(0, 3), expectedNormal),
    'First normal should remain unchanged after translation'
  ).toBeTruthy();
});

// Test rotation transform
it('Test vtkTransformPolyDataFilter with rotation transform', () => {
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

  expect(
    vtkMath.areEquals(outputPoints, expectedPoints),
    'Points should be rotated correctly'
  ).toBeTruthy();

  // Check one vector and one normal after rotation
  const outputVectors = output.getPointData().getVectors().getData();
  const outputNormals = output.getPointData().getNormals().getData();

  // After 90-degree Z rotation, vectors and normals pointing in Z remain unchanged
  const expectedVector = [0.0, 0.0, 1.0];
  const expectedNormal = [0.0, 0.0, 1.0];

  expect(
    vtkMath.areEquals(outputVectors.slice(0, 3), expectedVector),
    'First vector should remain unchanged after Z rotation'
  ).toBeTruthy();
  expect(
    vtkMath.areEquals(outputNormals.slice(0, 3), expectedNormal),
    'First normal should remain unchanged after Z rotation'
  ).toBeTruthy();
});

// Test scaling transform
it('Test vtkTransformPolyDataFilter with scaling transform', () => {
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
  expect(
    vtkMath.areEquals(outputPoints, expectedPoints),
    'Points should be scaled correctly'
  ).toBeTruthy();

  // Check transformed vectors
  const outputVectors = output.getPointData().getVectors().getData();
  const actualVector = outputVectors.slice(0, 3);
  const expectedVector = [0.0, 0.0, 4.0]; // Z component scaled by 4
  expect(
    vtkMath.areEquals(actualVector, expectedVector),
    `First vector should be scaled correctly: expected [${expectedVector}], got [${actualVector}]`
  ).toBeTruthy();

  // Check transformed normals
  const outputNormals = output.getPointData().getNormals().getData();
  const actualNormal = outputNormals.slice(0, 3);
  const expectedNormal = [0.0, 0.0, 1];
  expect(
    vtkMath.areEquals(actualNormal, expectedNormal),
    `First normal should be transformed via inverse-transpose: expected [${expectedNormal}], got [${actualNormal}]`
  ).toBeTruthy();
});

// Test output precision settings
it('Test vtkTransformPolyDataFilter with output precision', () => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const inputData = createTestPolyData();

  const transform = vtkTransform.newInstance();
  // Test single precision
  filter.setOutputPointsPrecision(DesiredOutputPrecision.SINGLE);
  filter.setTransform(transform);
  filter.setInputData(inputData);
  filter.update();
  let output = filter.getOutputData();
  expect(
    output.getPoints().getDataType(),
    'Single precision should use FLOAT'
  ).toBe(VtkDataTypes.FLOAT);

  // Test double precision
  filter.setOutputPointsPrecision(DesiredOutputPrecision.DOUBLE);
  filter.update();
  output = filter.getOutputData();
  expect(
    output.getPoints().getDataType(),
    'Double precision should use DOUBLE'
  ).toBe(VtkDataTypes.DOUBLE);
});

// Test empty input handling
it('Test vtkTransformPolyDataFilter with empty input', () => {
  const filter = vtkTransformPolyDataFilter.newInstance();
  const emptyData = vtkPolyData.newInstance();

  const transform = vtkTransform.newInstance();
  filter.setTransform(transform);
  filter.setInputData(emptyData);
  filter.update();

  const output = filter.getOutputData();
  expect(
    output.getNumberOfPoints(),
    'Empty input should produce empty output'
  ).toBe(0);
});

// Test topology preservation
it('Test vtkTransformPolyDataFilter with topology preservation', () => {
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

  expect(
    vtkMath.areEquals(inputPolys, outputPolys),
    'Polygon topology should be preserved'
  ).toBeTruthy();
});

// Test transform with vectors and normals
it('Test vtkTransformPolyDataFilter with vectors and normals transformation', () => {
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
  expect(
    outputPointData.getVectors(),
    'Output should have vectors'
  ).toBeTruthy();
  expect(
    outputPointData.getNormals(),
    'Output should have normals'
  ).toBeTruthy();

  // After 90-degree rotation around X: (x,y,z) -> (x,-z,y)
  // So (0,0,1) -> (0,-1,0)
  const outputVectors = outputPointData.getVectors().getData();
  const expectedVectors = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];

  expect(
    vtkMath.areEquals(outputVectors, expectedVectors),
    'Vectors should be transformed correctly'
  ).toBeTruthy();

  const outputNormals = outputPointData.getNormals().getData();

  const expectedNormals = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];
  expect(
    vtkMath.areEquals(outputNormals, expectedNormals),
    'Normals should be transformed correctly'
  ).toBeTruthy();
});

// Test transform with cell vectors and cell normals
it('Test vtkTransformPolyDataFilter with cell normals and vectors transformation', () => {
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
  expect(
    outputCellData.getVectors(),
    'Output should have cell vectors'
  ).toBeTruthy();
  expect(
    outputCellData.getNormals(),
    'Output should have cell normals'
  ).toBeTruthy();

  // After 90-degree X rotation: (x,y,z) -> (x,-z,y)
  // So (0,0,1) -> (0,-1,0)
  const outputCellVectors = outputCellData.getVectors().getData();
  const expectedCellVectors = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];

  expect(
    vtkMath.areEquals(outputCellVectors, expectedCellVectors),
    'Cell vectors should be transformed correctly'
  ).toBeTruthy();

  const outputCellNormals = outputCellData.getNormals().getData();
  const expectedCellNormals = [0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0];

  expect(
    vtkMath.areEquals(outputCellNormals, expectedCellNormals),
    'Cell normals should be transformed correctly'
  ).toBeTruthy();
});
