import { it, expect } from 'vitest';
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

it('vtkTriangleStrip - Initialization with points', () => {
  const triangleStrip = createSimpleTriangleStrip();

  expect(triangleStrip.getNumberOfPoints()).toBe(4);
  expect(triangleStrip.getNumberOfEdges()).toBe(4);
  expect(triangleStrip.getNumberOfFaces()).toBe(0);
});

it('vtkTriangleStrip - complex triangle strip', () => {
  const triangleStrip = createComplexTriangleStrip();

  expect(triangleStrip.getNumberOfPoints()).toBe(5);
  expect(triangleStrip.getNumberOfEdges()).toBe(5);

  // Test triangulation of complex strip
  const result = triangleStrip.triangulate();
  const pts = triangleStrip.getPointArray();

  expect(result).toBeTruthy();
  expect(pts.length).toBe(9);
});

it('vtkTriangleStrip - edge cases', () => {
  const triangleStrip = vtkTriangleStrip.newInstance();
  const points = vtkPoints.newInstance();

  // Test with minimum points (3 points = 1 triangle)
  points.setData([0, 0, 0, 1, 0, 0, 0, 1, 0]);

  triangleStrip.initialize(points, [0, 1, 2]);

  expect(triangleStrip.getNumberOfPoints()).toBe(3);

  const result = triangleStrip.triangulate();
  const pts = triangleStrip.getPointArray();

  expect(result).toBeTruthy();
  expect(pts.length).toBe(3);
});

it('vtkTriangleStrip - getCellBoundary', () => {
  const triangleStrip = createSimpleTriangleStrip();
  const pts = [];
  const pcoords = [0.5, 0.5, 0];

  const result = triangleStrip.cellBoundary(0, pcoords, pts);

  expect(result).toBeTruthy();
  expect(pts.length === 2).toBeTruthy();
});

it('vtkTriangleStrip - triangulate', () => {
  const triangleStrip = createSimpleTriangleStrip();
  const result = triangleStrip.triangulate();
  const ptIds = triangleStrip.getPointArray();

  expect(result).toBeTruthy();
  expect(ptIds.length).toBe(6);

  // Check triangle winding order
  const tri1 = [ptIds[0], ptIds[1], ptIds[2]];
  const tri2 = [ptIds[3], ptIds[4], ptIds[5]];

  expect(tri1).toEqual([0, 1, 2]);
  expect(tri2).toEqual([2, 1, 3]);
});

it('vtkTriangleStrip - derivatives', () => {
  const triangleStrip = createSimpleTriangleStrip();

  const subId = 0;
  const dim = 1;
  const pcoords = [0.2, 0.3, 0];
  // Constant field
  let derivs = [];
  triangleStrip.derivatives(subId, pcoords, [7, 7, 7, 7], dim, derivs);
  expect(derivs).toEqual([0, 0, 0]);

  // Linear in x
  derivs = [];
  triangleStrip.derivatives(subId, pcoords, [0, 1, 0, 1], dim, derivs);
  expect(Math.abs(derivs[0] - 1) < 1e-6).toBeTruthy();
  expect(Math.abs(derivs[1]) < 1e-6).toBeTruthy();
  expect(Math.abs(derivs[2]) < 1e-6).toBeTruthy();

  // Linear in y
  derivs = [];
  triangleStrip.derivatives(subId, pcoords, [0, 0, 1, 1], dim, derivs);
  expect(Math.abs(derivs[0]) < 1e-6).toBeTruthy();
  expect(Math.abs(derivs[1] - 1) < 1e-6).toBeTruthy();
  expect(Math.abs(derivs[2]) < 1e-6).toBeTruthy();
});

it('vtkTriangleStrip - evaluatePosition', () => {
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

  expect(result.evaluation).toBeTruthy();
  expect(dist2[0] >= 0).toBeTruthy();

  // Check that weights sum to 1 for the relevant triangle
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  expect(Math.abs(weightSum - 1.0) < 1e-10).toBeTruthy();
});

it('vtkTriangleStrip - evaluateLocation', () => {
  const triangleStrip = createSimpleTriangleStrip();

  const subId = 0;
  const pcoords = [0.5, 0.25, 0];
  const x = [0, 0, 0];
  const weights = [];

  triangleStrip.evaluateLocation(subId, pcoords, x, weights);

  expect(x[0] >= 0 && x[0] <= 1).toBeTruthy();
  expect(x[1] >= 0 && x[1] <= 1).toBeTruthy();
  expect(x[2]).toBe(0);

  // Check that weights sum to 1
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  expect(Math.abs(weightSum - 1.0) < 1e-10).toBeTruthy();
});

it('vtkTriangleStrip - getEdge', () => {
  const triangleStrip = createSimpleTriangleStrip();

  // Test first edge
  const edge0 = triangleStrip.getEdge(0);
  expect(edge0).toBeTruthy();
  expect(edge0.getClassName()).toBe('vtkLine');

  // Test middle edge
  const edge1 = triangleStrip.getEdge(1);
  expect(edge1).toBeTruthy();

  // Test last edge
  const lastEdge = triangleStrip.getEdge(3);
  expect(lastEdge).toBeTruthy();
});

it('vtkTriangleStrip - intersectWithLine', () => {
  const triangleStrip = createSimpleTriangleStrip();

  // Line that intersects the triangle strip
  const p1 = [0, 1, 0];
  const p2 = [0, 1, 1];
  const tol = 0.01;
  const x = [];
  const pcoords = [];
  // const subId = [0];

  const result = triangleStrip.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(result.intersect).toBeTruthy();

  // Line that doesn't intersect
  const p3 = [-2, 0, 0];
  const p4 = [-1, 0, 0];
  const result2 = triangleStrip.intersectWithLine(p3, p4, tol, x, pcoords);

  expect(result2.intersect).toBeFalsy();
});

it('vtkTriangleStrip - getParametricCenter', () => {
  const triangleStrip = createSimpleTriangleStrip();
  const pcoords = [0, 0, 0];

  const subId = triangleStrip.getParametricCenter(pcoords);

  expect(subId >= 0).toBeTruthy();
  expect(Math.abs(pcoords[0] - 0.333333) < 1e-5).toBeTruthy();
  expect(Math.abs(pcoords[1] - 0.333333) < 1e-5).toBeTruthy();
  expect(pcoords[2]).toBe(0);
});

it('vtkTriangleStrip - decomposeStrip static method', () => {
  const polys = vtkCellArray.newInstance();
  const pts = [0, 1, 2, 3, 4];

  // Create a triangle strip instance to call the method
  vtkTriangleStrip.decomposeStrip(pts, polys);

  expect(polys.getNumberOfCells()).toBe(3);

  const expectedTris = [
    Uint32Array.from([0, 1, 2]),
    Uint32Array.from([2, 1, 3]),
    Uint32Array.from([2, 3, 4]),
  ];

  const data = polys.getData();
  const tri1 = data.subarray(1, 4);
  const tri2 = data.subarray(5, 8);
  const tri3 = data.subarray(9, 12);

  expect(tri1).toEqual(expectedTris[0]);
  expect(tri2).toEqual(expectedTris[1]);
  expect(tri3).toEqual(expectedTris[2]);
});
