import { it, expect } from 'vitest';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkDataSetAttributes from 'vtk.js/Sources/Common/DataModel/DataSetAttributes';
import vtkMergePoints from 'vtk.js/Sources/Common/DataModel/MergePoints';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

it('Test vtkTriangle instance', () => {
  expect(vtkTriangle, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkTriangle.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkTriangle static::computeNormalDirection', () => {
  // Invalid
  const v1 = [0, 0, 0];
  let v2 = [0, 0, 0];
  let v3 = [0, 0, 0];
  const n = [];
  vtkTriangle.computeNormalDirection(v1, v2, v3, n);
  expect(n).toEqual([0, 0, 0]);

  // Valid
  v2 = [2, 0, 0];
  v3 = [0, 2, 0];
  vtkTriangle.computeNormalDirection(v1, v2, v3, n);
  expect(n).toEqual([0, 0, 4]);

  // Flipped
  v2 = [0, 2, 0];
  v3 = [2, 0, 0];
  vtkTriangle.computeNormalDirection(v1, v2, v3, n);
  expect(n).toEqual([0, 0, -4]);
});

it('Test vtkTriangle static::computeNormal', () => {
  // Invalid
  const v1 = [0, 0, 0];
  let v2 = [0, 0, 0];
  let v3 = [0, 0, 0];
  const n = [];
  vtkTriangle.computeNormal(v1, v2, v3, n);
  expect(n).toEqual([0, 0, 0]);

  // Valid
  v2 = [2, 0, 0];
  v3 = [0, 2, 0];
  vtkTriangle.computeNormal(v1, v2, v3, n);
  expect(n).toEqual([0, 0, 1]);

  // Flipped
  v2 = [0, 2, 0];
  v3 = [2, 0, 0];
  vtkTriangle.computeNormal(v1, v2, v3, n);
  expect(n).toEqual([0, 0, -1]);
});

it('Test vtkTriangle intersectWithLine', () => {
  const yesIntersection = 1;
  const noIntersection = 0;

  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(4); // only first 3 are considered
  points.setData(Float32Array.from([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]));
  // Add points
  const triangle = vtkTriangle.newInstance();
  triangle.initialize(points);

  // No intersection
  let p1 = [0, 1, 0];
  let p2 = [0, 1, 1];
  const tol = 0.01;
  const x = [];
  const pcoords = [];
  let intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(noIntersection);

  // Intersect on v1
  p1 = [0, 0, 0];
  p2 = [0, 0, 1];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(yesIntersection);
  expect(intersection.t).toBe(0);
  expect(x).toEqual(p1);
  expect(pcoords).toEqual([0, 0, 0]);

  // Intersect on v3
  p1 = [1, 1, 1];
  p2 = [1, 1, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(yesIntersection);
  expect(intersection.t).toBe(1);
  expect(x).toEqual(p2);
  expect(pcoords).toEqual([0, 1, 0]);

  // No intersection if finite line
  p1 = [-2, 0, 0];
  p2 = [-1, 0, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(noIntersection);

  // Parallel to v2,v3
  p1 = [2, 0, 0];
  p2 = [2, 1, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(noIntersection);

  // Line coplanar to triangle
  p1 = [0.5, -1, 0];
  p2 = [0.5, 1, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(noIntersection);
  expect(intersection.t).toBe(Number.MAX_VALUE);
  expect(pcoords).toEqual([0, 0, 0]);
});

it('Test vtkTriangle evaluatePosition', () => {
  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(3);
  points.setData(Float32Array.from([0, 0, 0, 2, 0, 0, 2, 2, 0]));
  const pointIdList = [0, 1, 2];
  // Add points
  const triangle = vtkTriangle.newInstance();
  triangle.initialize(points, pointIdList);

  // v3
  let x = [2, 2, 0];
  const weights = [];
  const closestPoint = [];
  const pcoords = [];
  let result = triangle.evaluatePosition(x, closestPoint, pcoords, weights);
  expect(result.evaluation).toBe(1);
  // subId does not matter
  expect(result.dist2).toBe(0);
  expect(pcoords).toEqual([0, 1, 0]);
  expect(weights).toEqual([0, 0, 1]);

  // Center
  x = [Math.sqrt(2), 2 - Math.sqrt(2), 0];
  result = triangle.evaluatePosition(x, closestPoint, pcoords, weights);
  expect(result.evaluation).toBe(1);
  // subId does not matter
  expect(result.dist2).toBe(0.0);
  expect(pcoords).toEqual([Math.sqrt(2) - 1, (2 - Math.sqrt(2)) / 2, 0]);
  expect(weights).toEqual([
    (2 - Math.sqrt(2)) / 2,
    Math.sqrt(2) - 1,
    (2 - Math.sqrt(2)) / 2,
  ]);

  // Outside
  x = [0, 2, 0];
  result = triangle.evaluatePosition(x, closestPoint, pcoords, weights);
  expect(result.evaluation).toBe(0);
  // subId does not matter
  expect(result.dist2).toBe(2);
  expect(pcoords).toEqual([-1, 1, 0]);
  expect(weights).toEqual([1, -1, 1]);
});

it('Test vtkTriangle intersectWithTriangle with intersection', () => {
  const intersection = vtkTriangle.intersectWithTriangle(
    [0.5, 0, 0],
    [0.5, 1, 0],
    [0.5, 1, 1],
    [0, 0.5, 0],
    [1, 0.5, 0],
    [1, 0.5, 1]
  );
  expect(intersection.intersect).toBe(true);
  expect(intersection.coplanar).toBe(false);
  expect(
    vtkMath.areEquals(intersection.pt1, [0.5, 0.5, 0.5]),
    `p1: ${intersection.pt1}`
  ).toBeTruthy();
  expect(
    vtkMath.areEquals(intersection.pt2, [0.5, 0.5, 0]),
    `p2: ${intersection.pt2}`
  ).toBeTruthy();
});

it('Test vtkTriangle intersectWithTriangle no intersection', () => {
  const intersection2 = vtkTriangle.intersectWithTriangle(
    [-0.32499998807907104, -0.029999999329447746, 0],
    [-0.32499998807907104, -0.014999999664723873, -0.025980761274695396],
    [0.32499998807907104, -0.029999999329447746, 0],
    [0.02897777408361435, -0.22431930899620056, -0.23530007898807526],
    [0.02897777408361435, 0.23530007898807526, 0.22431930899620056],
    [0.02121320366859436, 0.21480970084667206, 0.24480970203876495]
  );
  expect(intersection2.intersect).toBe(false);
  expect(intersection2.coplanar).toBe(false);
});

it('Test vtkTriangle intersectWithTriangle coplanar', () => {
  const intersection3 = vtkTriangle.intersectWithTriangle(
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 2, 1]
  );
  expect(intersection3.intersect).toBe(false);
  expect(intersection3.coplanar).toBe(true);
});

it('Test vtkTriangle clip', () => {
  const points = vtkPoints.newInstance();
  points.setData(Float32Array.from([-1, 0, 0, 1, 0, 0, 1, 1, 0]), 3);

  const triangle = vtkTriangle.newInstance();
  triangle.initialize(points, [0, 1, 2]);

  const cellScalars = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float32Array([-1, 1, 1]),
  });

  const locatorPoints = vtkPoints.newInstance();
  const locator = vtkMergePoints.newInstance();
  locator.initPointInsertion(locatorPoints, [-1, 1, 0, 1, 0, 0]);

  const tris = vtkCellArray.newInstance();
  const inPd = vtkDataSetAttributes.newInstance();
  const outPd = vtkDataSetAttributes.newInstance();
  const inCd = vtkDataSetAttributes.newInstance();
  const outCd = vtkDataSetAttributes.newInstance();

  triangle.clip(
    0,
    cellScalars,
    locator,
    tris,
    inPd,
    outPd,
    inCd,
    0,
    outCd,
    false
  );

  expect(tris.getNumberOfCells(), 'Should clip triangle into 2 triangles').toBe(
    2
  );
  expect(
    locatorPoints.getNumberOfPoints(),
    4,
    'Should create 4 unique kept points'
  ).toBe(4);
});
