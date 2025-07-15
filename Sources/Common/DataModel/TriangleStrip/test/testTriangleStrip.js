import test from 'tape';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkTriangleStrip from 'vtk.js/Sources/Common/DataModel/TriangleStrip';

// Helper function to create a simple triangle strip
function createSimpleTriangleStrip() {
  const triangleStrip = vtkTriangleStrip.newInstance();
  const points = vtkPoints.newInstance();

  // Create a simple triangle strip with 4 points forming 2 triangles
  points.setNumberOfPoints(4);
  points.setData(
    Float32Array.from([
      0,
      0,
      0, // Point 0
      1,
      0,
      0, // Point 1
      0,
      1,
      0, // Point 2
      1,
      1,
      0, // Point 3
    ])
  );

  const pointsIds = [0, 1, 2, 3];
  triangleStrip.initialize(points, pointsIds);
  return triangleStrip;
}

// Helper function to create a more complex triangle strip
function createComplexTriangleStrip() {
  const triangleStrip = vtkTriangleStrip.newInstance();
  const points = vtkPoints.newInstance();

  // Create a zigzag pattern with 5 points
  points.setData([
    0,
    0,
    0, // Point 0
    1,
    0,
    0, // Point 1
    0.5,
    1,
    0, // Point 2
    1.5,
    1,
    0, // Point 3
    1,
    2,
    0, // Point 4
  ]);

  triangleStrip.initialize(points, [0, 1, 2, 3, 4]);
  return triangleStrip;
}

test('vtkTriangleStrip - Initialization with points', (t) => {
  const triangleStrip = createSimpleTriangleStrip();

  t.equal(triangleStrip.getNumberOfPoints(), 4, 'Should have 4 points');
  t.equal(triangleStrip.getNumberOfEdges(), 4, 'Should have 4 edges');
  t.equal(triangleStrip.getNumberOfFaces(), 0, 'Should have 0 faces');

  t.end();
});

test('vtkTriangleStrip - complex triangle strip', (t) => {
  const triangleStrip = createComplexTriangleStrip();

  t.equal(triangleStrip.getNumberOfPoints(), 5, 'Should have 5 points');
  t.equal(triangleStrip.getNumberOfEdges(), 5, 'Should have 5 edges');

  // Test triangulation of complex strip
  const result = triangleStrip.triangulate();
  const pts = triangleStrip.getPointArray();

  t.ok(result, 'Complex triangulation should succeed');
  t.equal(pts.length, 9, 'Should have 9 point IDs (3 triangles * 3 points)');

  t.end();
});

test('vtkTriangleStrip - edge cases', (t) => {
  const triangleStrip = vtkTriangleStrip.newInstance();
  const points = vtkPoints.newInstance();

  // Test with minimum points (3 points = 1 triangle)
  points.setData([0, 0, 0, 1, 0, 0, 0, 1, 0]);

  triangleStrip.initialize(points, [0, 1, 2]);

  t.equal(triangleStrip.getNumberOfPoints(), 3, 'Should handle minimum case');

  const result = triangleStrip.triangulate();
  const pts = triangleStrip.getPointArray();

  t.ok(result, 'Should triangulate single triangle');
  t.equal(pts.length, 3, 'Should have 3 point IDs for single triangle');

  t.end();
});

test('vtkTriangleStrip - getCellBoundary', (t) => {
  const triangleStrip = createSimpleTriangleStrip();
  const pts = [];
  const pcoords = [0.5, 0.5, 0];

  const result = triangleStrip.cellBoundary(0, pcoords, pts);

  t.ok(result, 'Should return valid boundary result');
  t.ok(pts.length === 2, 'Should return 2 points for boundary');

  t.end();
});

test('vtkTriangleStrip - triangulate', (t) => {
  const triangleStrip = createSimpleTriangleStrip();
  const result = triangleStrip.triangulate();
  const ptIds = triangleStrip.getPointArray();

  t.ok(result, 'Triangulation should succeed');
  t.equal(ptIds.length, 6, 'Should have 6 point IDs (2 triangles * 3 points)');

  // Check triangle winding order
  const tri1 = [ptIds[0], ptIds[1], ptIds[2]];
  const tri2 = [ptIds[3], ptIds[4], ptIds[5]];

  t.deepEqual(tri1, [0, 1, 2], 'First triangle should have correct winding');
  t.deepEqual(
    tri2,
    [2, 1, 3],
    'Second triangle should have correct winding (flipped)'
  );

  t.end();
});

test('vtkTriangleStrip - derivatives', (t) => {
  const triangleStrip = createSimpleTriangleStrip();

  const subId = 0;
  const dim = 1;
  const pcoords = [0.2, 0.3, 0];
  // Constant field
  let derivs = [];
  triangleStrip.derivatives(subId, pcoords, [7, 7, 7, 7], dim, derivs);
  t.deepEqual(derivs, [0, 0, 0], 'Constant field should have zero gradient');

  // Linear in x
  derivs = [];
  triangleStrip.derivatives(subId, pcoords, [0, 1, 0, 1], dim, derivs);
  t.ok(Math.abs(derivs[0] - 1) < 1e-6, 'dV/dx should be 1 for linear x field');
  t.ok(Math.abs(derivs[1]) < 1e-6, 'dV/dy should be 0 for linear x field');
  t.ok(Math.abs(derivs[2]) < 1e-6, 'dV/dz should be 0 for planar triangle');

  // Linear in y
  derivs = [];
  triangleStrip.derivatives(subId, pcoords, [0, 0, 1, 1], dim, derivs);
  t.ok(Math.abs(derivs[0]) < 1e-6, 'dV/dx should be 0 for linear y field');
  t.ok(Math.abs(derivs[1] - 1) < 1e-6, 'dV/dy should be 1 for linear y field');
  t.ok(Math.abs(derivs[2]) < 1e-6, 'dV/dz should be 0 for planar triangle');

  t.end();
});

test('vtkTriangleStrip - evaluatePosition', (t) => {
  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(3);
  points.setData(Float32Array.from([0, 0, 0, 2, 0, 0, 2, 2, 0]));
  const pointIdList = [0, 1, 2];
  // Add points
  const triangleStrip = vtkTriangleStrip.newInstance();
  triangleStrip.initialize(points, pointIdList);

  // Test point inside first triangle
  const x = [2, 2, 0];
  const closestPoint = [];
  const pcoords = [];
  const dist2 = [0];
  const weights = [];

  const result = triangleStrip.evaluatePosition(
    x,
    closestPoint,
    pcoords,
    dist2,
    weights
  );

  t.ok(result.evaluation, 'Should return valid status');
  t.ok(dist2[0] >= 0, 'Distance should be non-negative');

  // Check that weights sum to 1 for the relevant triangle
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  t.ok(Math.abs(weightSum - 1.0) < 1e-10, 'Weights should sum to 1');

  t.end();
});

test('vtkTriangleStrip - evaluateLocation', (t) => {
  const triangleStrip = createSimpleTriangleStrip();

  const subId = 0;
  const pcoords = [0.5, 0.25, 0];
  const x = [0, 0, 0];
  const weights = [];

  triangleStrip.evaluateLocation(subId, pcoords, x, weights);

  t.ok(x[0] >= 0 && x[0] <= 1, 'X coordinate should be in valid range');
  t.ok(x[1] >= 0 && x[1] <= 1, 'Y coordinate should be in valid range');
  t.equal(x[2], 0, 'Z coordinate should be 0');

  // Check that weights sum to 1
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  t.ok(Math.abs(weightSum - 1.0) < 1e-10, 'Weights should sum to 1');

  t.end();
});

test('vtkTriangleStrip - getEdge', (t) => {
  const triangleStrip = createSimpleTriangleStrip();

  // Test first edge
  const edge0 = triangleStrip.getEdge(0);
  t.ok(edge0, 'Should return valid edge');
  t.equal(edge0.getClassName(), 'vtkLine', 'Edge should be a line');

  // Test middle edge
  const edge1 = triangleStrip.getEdge(1);
  t.ok(edge1, 'Should return valid edge');

  // Test last edge
  const lastEdge = triangleStrip.getEdge(3);
  t.ok(lastEdge, 'Should return valid edge');

  t.end();
});

test('vtkTriangleStrip - intersectWithLine', (tc) => {
  const triangleStrip = createSimpleTriangleStrip();

  // Line that intersects the triangle strip
  const p1 = [0, 1, 0];
  const p2 = [0, 1, 1];
  const tol = 0.01;
  const x = [];
  const pcoords = [];
  // const subId = [0];

  const result = triangleStrip.intersectWithLine(p1, p2, tol, x, pcoords);
  tc.ok(result.intersect, 'Should intersect with line');
  // tc.ok(subId[0] >= 0, 'SubId should be valid');

  // Line that doesn't intersect
  const p3 = [-2, 0, 0];
  const p4 = [-1, 0, 0];
  const result2 = triangleStrip.intersectWithLine(p3, p4, tol, x, pcoords);

  tc.notOk(result2.intersect, 'Should not intersect with line outside strip');

  tc.end();
});

test('vtkTriangleStrip - getParametricCenter', (t) => {
  const triangleStrip = createSimpleTriangleStrip();
  const pcoords = [0, 0, 0];

  const subId = triangleStrip.getParametricCenter(pcoords);

  t.ok(subId >= 0, 'SubId should be valid');
  t.ok(Math.abs(pcoords[0] - 0.333333) < 1e-5, 'Parametric U should be ~1/3');
  t.ok(Math.abs(pcoords[1] - 0.333333) < 1e-5, 'Parametric V should be ~1/3');
  t.equal(pcoords[2], 0, 'Parametric W should be 0');

  t.end();
});

test('vtkTriangleStrip - decomposeStrip static method', (t) => {
  const polys = vtkCellArray.newInstance();
  const pts = [0, 1, 2, 3, 4];

  // Create a triangle strip instance to call the method
  vtkTriangleStrip.decomposeStrip(pts, polys);

  t.equal(
    polys.getNumberOfCells(),
    3,
    'Should create 3 triangles from 5 points'
  );

  const expectedTris = [
    Uint32Array.from([0, 1, 2]),
    Uint32Array.from([2, 1, 3]),
    Uint32Array.from([2, 3, 4]),
  ];

  const data = polys.getData();
  const tri1 = data.subarray(1, 4);
  const tri2 = data.subarray(5, 8);
  const tri3 = data.subarray(9, 12);

  t.deepEqual(
    tri1,
    expectedTris[0],
    'First triangle should have correct order'
  );
  t.deepEqual(tri2, expectedTris[1], 'Second triangle should be flipped');
  t.deepEqual(
    tri3,
    expectedTris[2],
    'Third triangle should have correct order'
  );

  t.end();
});
