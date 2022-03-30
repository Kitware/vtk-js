import test from 'tape-catch';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

test('Test vtkTriangle instance', (t) => {
  t.ok(vtkTriangle, 'Make sure the class definition exists');
  const instance = vtkTriangle.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkTriangle static::computeNormalDirection', (t) => {
  // Invalid
  const v1 = [0, 0, 0];
  let v2 = [0, 0, 0];
  let v3 = [0, 0, 0];
  const n = [];
  vtkTriangle.computeNormalDirection(v1, v2, v3, n);
  t.deepEqual(n, [0, 0, 0]);

  // Valid
  v2 = [2, 0, 0];
  v3 = [0, 2, 0];
  vtkTriangle.computeNormalDirection(v1, v2, v3, n);
  t.deepEqual(n, [0, 0, 4]);

  // Flipped
  v2 = [0, 2, 0];
  v3 = [2, 0, 0];
  vtkTriangle.computeNormalDirection(v1, v2, v3, n);
  t.deepEqual(n, [0, 0, -4]);
  t.end();
});

test('Test vtkTriangle static::computeNormal', (t) => {
  // Invalid
  const v1 = [0, 0, 0];
  let v2 = [0, 0, 0];
  let v3 = [0, 0, 0];
  const n = [];
  vtkTriangle.computeNormal(v1, v2, v3, n);
  t.deepEqual(n, [0, 0, 0]);

  // Valid
  v2 = [2, 0, 0];
  v3 = [0, 2, 0];
  vtkTriangle.computeNormal(v1, v2, v3, n);
  t.deepEqual(n, [0, 0, 1]);

  // Flipped
  v2 = [0, 2, 0];
  v3 = [2, 0, 0];
  vtkTriangle.computeNormal(v1, v2, v3, n);
  t.deepEqual(n, [0, 0, -1]);
  t.end();
});

test('Test vtkTriangle intersectWithLine', (t) => {
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
  t.equal(intersection.intersect, noIntersection);

  // Intersect on v1
  p1 = [0, 0, 0];
  p2 = [0, 0, 1];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(intersection.intersect, yesIntersection);
  t.equal(intersection.t, 0);
  t.deepEqual(x, p1);
  t.deepEqual(pcoords, [0, 0, 0]);

  // Intersect on v3
  p1 = [1, 1, 1];
  p2 = [1, 1, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(intersection.intersect, yesIntersection);
  t.equal(intersection.t, 1);
  t.deepEqual(x, p2);
  t.deepEqual(pcoords, [0, 1, 0]);

  // No intersection if finite line
  p1 = [-2, 0, 0];
  p2 = [-1, 0, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(intersection.intersect, noIntersection);

  // Parallel to v2,v3
  p1 = [2, 0, 0];
  p2 = [2, 1, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(intersection.intersect, noIntersection);

  // Line coplanar to triangle
  p1 = [0.5, -1, 0];
  p2 = [0.5, 1, 0];
  intersection = triangle.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(intersection.intersect, noIntersection);
  t.equal(intersection.t, Number.MAX_VALUE);
  t.deepEqual(pcoords, [0, 0, 0]);
  t.end();
});

test('Test vtkTriangle evaluatePosition', (t) => {
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
  t.equal(result.evaluation, 1);
  // subId does not matter
  t.equal(result.dist2, 0);
  t.deepEqual(pcoords, [0, 1, 0]);
  t.deepEqual(weights, [0, 0, 1]);

  // Center
  x = [Math.sqrt(2), 2 - Math.sqrt(2), 0];
  result = triangle.evaluatePosition(x, closestPoint, pcoords, weights);
  t.equal(result.evaluation, 1);
  // subId does not matter
  t.equal(result.dist2, 0.0);
  t.deepEqual(pcoords, [Math.sqrt(2) - 1, (2 - Math.sqrt(2)) / 2, 0]);
  t.deepEqual(weights, [
    (2 - Math.sqrt(2)) / 2,
    Math.sqrt(2) - 1,
    (2 - Math.sqrt(2)) / 2,
  ]);

  // Outside
  x = [0, 2, 0];
  result = triangle.evaluatePosition(x, closestPoint, pcoords, weights);
  t.equal(result.evaluation, 0);
  // subId does not matter
  t.equal(result.dist2, 2);
  t.deepEqual(pcoords, [-1, 1, 0]);
  t.deepEqual(weights, [1, -1, 1]);
  t.end();
});

test('Test vtkTriangle intersectWithTriangle with intersection', (t) => {
  const intersection = vtkTriangle.intersectWithTriangle(
    [0.5, 0, 0],
    [0.5, 1, 0],
    [0.5, 1, 1],
    [0, 0.5, 0],
    [1, 0.5, 0],
    [1, 0.5, 1]
  );
  t.equal(intersection.intersect, true);
  t.equal(intersection.coplanar, false);
  t.ok(
    vtkMath.areEquals(intersection.pt1, [0.5, 0.5, 0.5]),
    `p1: ${intersection.pt1}`
  );
  t.ok(
    vtkMath.areEquals(intersection.pt2, [0.5, 0.5, 0]),
    `p2: ${intersection.pt2}`
  );
  t.end();
});

test('Test vtkTriangle intersectWithTriangle no intersection', (t) => {
  const intersection2 = vtkTriangle.intersectWithTriangle(
    [-0.32499998807907104, -0.029999999329447746, 0],
    [-0.32499998807907104, -0.014999999664723873, -0.025980761274695396],
    [0.32499998807907104, -0.029999999329447746, 0],
    [0.02897777408361435, -0.22431930899620056, -0.23530007898807526],
    [0.02897777408361435, 0.23530007898807526, 0.22431930899620056],
    [0.02121320366859436, 0.21480970084667206, 0.24480970203876495]
  );
  t.equal(intersection2.intersect, false);
  t.equal(intersection2.coplanar, false);
  t.end();
});

test('Test vtkTriangle intersectWithTriangle coplanar', (t) => {
  const intersection3 = vtkTriangle.intersectWithTriangle(
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 2, 1]
  );
  t.equal(intersection3.intersect, false);
  t.equal(intersection3.coplanar, true);

  t.end();
});
