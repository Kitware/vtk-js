import test from 'tape-catch';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

test('Test vtkLine instance', (t) => {
  t.ok(vtkLine, 'Make sure the class definition exists');
  const instance = vtkLine.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkLine static::intersection', (t) => {
  const onLine = 2; // vtkLine.IntersectionState.ON_LINE
  const yesIntersection = 1; // vtkLine.IntersectionState.YES_INTERSECTION
  const noIntersection = 0; // vtkLine.IntersectionState.NO_INTERSECTION
  // INVALID LINE
  let a1 = [0, 0, 0];
  let a2 = [0, 0, 0];
  let b1 = [1, 0, 0];
  let b2 = [1, 0, 0];
  const u = [];
  const v = [];
  let result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  t.equal(result, onLine, 'Points on line');
  // u and v do not matter

  // SAME LINE
  a1 = [0, 0, 0];
  a2 = [1, 0, 0];
  b1 = [2, 0, 0];
  b2 = [1, 0, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  t.equal(result, onLine, 'Points on line');
  // u and v do not matter

  // PARALLEL LINE
  b1 = [2, 1, 0];
  b2 = [1, 1, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  t.equal(result, onLine, 'Points on line');
  // u and v do not matter

  // INTERSECTED LINE
  b1 = [0.5, 1, 0];
  b2 = [0.5, 0, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  t.equal(result, yesIntersection, 'Intersection');
  t.equal(u[0], 0.5);
  t.equal(v[0], 1);

  // INTERSECTED LINE but outside
  b1 = [2, 1, 0];
  b2 = [2, 0, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  t.equal(result, noIntersection, 'No intersection');
  // u and v do not matter
  t.end();
});

test('Test vtkLine static::distanceToLine', (t) => {
  // INVALID LINE : computes distance with p1
  let x = [10, 0, 0];
  const p1 = [0, 0, 0];
  let p2 = [0, 0, 0];
  const closestPoint = [];
  let ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  t.equal(Math.sqrt(ret.distance), 10, 'Invalid line');
  t.equal(ret.t, Number.MIN_VALUE);
  t.deepEqual(closestPoint, p1);

  // ON LINE : computes distance with p2
  p2 = [1, 0, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  t.equal(Math.sqrt(ret.distance), 9, 'On line');
  t.equal(ret.t, 10);
  t.deepEqual(closestPoint, p2);

  // BETWEEN LINE : computes distance with p1
  x = [0.5, 0, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  t.equal(ret.distance, 0);
  t.equal(ret.t, 0.5);
  t.deepEqual(closestPoint, x);

  // NEAR LINE : computes distance with p1
  x = [0.5, 1, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  t.equal(ret.distance, 1);
  t.equal(ret.t, 0.5);
  t.deepEqual(closestPoint, [0.5, 0, 0]);

  // OUTSIDE LINE : computes distance with p2
  x = [2, 1, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  t.equal(ret.distance, 2);
  t.equal(ret.t, 2);
  t.deepEqual(closestPoint, p2);
  t.end();
});

test('Test vtkLine intersectWithLine', (t) => {
  const yesIntersection = 1;
  const noIntersection = 0;

  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(3); // only first 2 points are considered
  points.setData([0, 0, 0, 1, 0, 0, 1, 1, 0]);
  const pointIdList = [0, 1, 2];
  // Add points
  const line = vtkLine.newInstance();
  line.initialize(points.getNumberOfPoints(), pointIdList, points);

  // INVALID LINE
  let p1 = [0, 0, 0];
  let p2 = [0, 0, 0];
  const tol = [];
  const x = [];
  const pcoords = [0, 0, 0];
  let result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(result.intersect, noIntersection);
  t.deepEqual(pcoords, p1);
  // t does not matter

  // SAME LINE
  p2 = [1, 0, 0];
  result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(result.intersect, noIntersection);
  // u and v do not matter

  // PERP LINE
  p1 = [1, 1, 0];
  result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(result.intersect, yesIntersection);
  t.deepEqual(pcoords, p2);
  t.equal(result.t, 1);

  // OUTSIDE LINE
  p2 = [1, 0.5, 0];
  result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(result.intersect, noIntersection);
  // t and pcoords do not matter
  t.end();
});
