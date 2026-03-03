import { it, expect } from 'vitest';
import vtkQuad from 'vtk.js/Sources/Common/DataModel/Quad';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import { QuadWithLineIntersectionState } from 'vtk.js/Sources/Common/DataModel/Quad/Constants';

it('Test vtkQuad instance', () => {
  expect(vtkQuad).toBeTruthy();
  const instance = vtkQuad.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkQuad intersectWithLine flat', () => {
  const points = vtkPoints.newInstance();
  points.setNumberOfPoints(4);
  points.setData(Float32Array.from([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]));
  // Add points
  const quad = vtkQuad.newInstance();
  quad.initialize(points);

  // No intersection
  let p1 = [0, 2, 0];
  let p2 = [0, 2, 1];
  const tol = 0.01;
  const x = [];
  const pcoords = [];
  let intersection;
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(
    QuadWithLineIntersectionState.NO_INTERSECTION
  );

  // Intersect on v1
  p1 = [0, 0, 0];
  p2 = [0, 0, 1];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(
    QuadWithLineIntersectionState.YES_INTERSECTION
  );
  expect(intersection.t).toBe(0);
  expect(x).toEqual(p1);
  expect(pcoords).toEqual([0, 0, 0]);

  // Intersect on v3
  p1 = [1, 1, 1];
  p2 = [1, 1, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(
    QuadWithLineIntersectionState.YES_INTERSECTION
  );
  expect(intersection.t).toBe(1);
  expect(x).toEqual(p2);
  expect(pcoords).toEqual([1, 1, 0]);

  // No intersection if finite line
  p1 = [-2, 0, 0];
  p2 = [-1, 0, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(
    QuadWithLineIntersectionState.NO_INTERSECTION
  );

  // Parallel to v2,v3
  p1 = [2, 0, 0];
  p2 = [2, 1, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(
    QuadWithLineIntersectionState.NO_INTERSECTION
  );

  // Line coplanar to quad
  p1 = [0.5, -1, 0];
  p2 = [0.5, 1, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  expect(intersection.intersect).toBe(
    QuadWithLineIntersectionState.NO_INTERSECTION
  );
});
