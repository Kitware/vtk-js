import { it, expect } from 'vitest';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

it('Test vtkLine instance', () => {
  expect(vtkLine).toBeTruthy();
  const instance = vtkLine.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkLine static::intersection', () => {
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
  expect(result).toBe(onLine);
  // u and v do not matter

  // SAME LINE
  a1 = [0, 0, 0];
  a2 = [1, 0, 0];
  b1 = [2, 0, 0];
  b2 = [1, 0, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  expect(result).toBe(onLine);
  // u and v do not matter

  // PARALLEL LINE
  b1 = [2, 1, 0];
  b2 = [1, 1, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  expect(result).toBe(onLine);
  // u and v do not matter

  // INTERSECTED LINE
  b1 = [0.5, 1, 0];
  b2 = [0.5, 0, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  expect(result).toBe(yesIntersection);
  expect(u[0]).toBe(0.5);
  expect(v[0]).toBe(1);

  // INTERSECTED LINE but outside
  b1 = [2, 1, 0];
  b2 = [2, 0, 0];
  result = vtkLine.intersection(a1, a2, b1, b2, u, v);
  expect(result).toBe(noIntersection);
  // u and v do not matter
});

it('Test vtkLine static::distanceToLine', () => {
  // INVALID LINE : computes distance with p1
  let x = [10, 0, 0];
  const p1 = [0, 0, 0];
  let p2 = [0, 0, 0];
  const closestPoint = [];
  let ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  expect(Math.sqrt(ret.distance)).toBe(10);
  expect(ret.t).toBe(Number.MIN_VALUE);
  expect(closestPoint).toEqual(p1);

  // ON LINE : computes distance with p2
  p2 = [1, 0, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  expect(Math.sqrt(ret.distance)).toBe(9);
  expect(ret.t).toBe(10);
  expect(closestPoint).toEqual(p2);

  // BETWEEN LINE : computes distance with p1
  x = [0.5, 0, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  expect(ret.distance).toBe(0);
  expect(ret.t).toBe(0.5);
  expect(closestPoint).toEqual(x);

  // NEAR LINE : computes distance with p1
  x = [0.5, 1, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  expect(ret.distance).toBe(1);
  expect(ret.t).toBe(0.5);
  expect(closestPoint).toEqual([0.5, 0, 0]);

  // OUTSIDE LINE : computes distance with p2
  x = [2, 1, 0];
  ret = vtkLine.distanceToLine(x, p1, p2, closestPoint);
  expect(ret.distance).toBe(2);
  expect(ret.t).toBe(2);
  expect(closestPoint).toEqual(p2);
});

it('Test vtkLine intersectWithLine', () => {
  const yesIntersection = 1;
  const noIntersection = 0;

  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(3); // only first 2 points are considered
  points.setData(Float32Array.from([0, 0, 0, 1, 0, 0, 1, 1, 0]));
  // Add points
  const line = vtkLine.newInstance();
  line.initialize(points);

  // INVALID LINE
  let p1 = [0, 0, 0];
  let p2 = [0, 0, 0];
  const tol = [];
  const x = [];
  const pcoords = [0, 0, 0];
  let result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(result.intersect).toBe(noIntersection);
  expect(pcoords).toEqual(p1);
  // t does not matter

  // SAME LINE
  p2 = [1, 0, 0];
  result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(result.intersect).toBe(noIntersection);
  // u and v do not matter

  // PERP LINE
  p1 = [1, 1, 0];
  result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(result.intersect).toBe(yesIntersection);
  expect(pcoords).toEqual(p2);
  expect(result.t).toBe(1);

  // OUTSIDE LINE
  p2 = [1, 0.5, 0];
  result = line.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(result.intersect).toBe(noIntersection);
  // t and pcoords do not matter
});
