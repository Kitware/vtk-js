import test from 'tape-catch';
import vtkQuad from 'vtk.js/Sources/Common/DataModel/Quad';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import { QuadWithLineIntersectionState } from 'vtk.js/Sources/Common/DataModel/Quad/Constants';

test('Test vtkQuad instance', (t) => {
  t.ok(vtkQuad, 'Make sure the class definition exists');
  const instance = vtkQuad.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkQuad intersectWithLine flat', (t) => {
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
  t.equal(
    intersection.intersect,
    QuadWithLineIntersectionState.NO_INTERSECTION
  );

  // Intersect on v1
  p1 = [0, 0, 0];
  p2 = [0, 0, 1];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(
    intersection.intersect,
    QuadWithLineIntersectionState.YES_INTERSECTION
  );
  t.equal(intersection.t, 0);
  t.deepEqual(x, p1);
  t.deepEqual(pcoords, [0, 0, 0]);

  // Intersect on v3
  p1 = [1, 1, 1];
  p2 = [1, 1, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(
    intersection.intersect,
    QuadWithLineIntersectionState.YES_INTERSECTION
  );
  t.equal(intersection.t, 1);
  t.deepEqual(x, p2);
  t.deepEqual(pcoords, [1, 1, 0]);

  // No intersection if finite line
  p1 = [-2, 0, 0];
  p2 = [-1, 0, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(
    intersection.intersect,
    QuadWithLineIntersectionState.NO_INTERSECTION
  );

  // Parallel to v2,v3
  p1 = [2, 0, 0];
  p2 = [2, 1, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(
    intersection.intersect,
    QuadWithLineIntersectionState.NO_INTERSECTION
  );

  // Line coplanar to quad
  p1 = [0.5, -1, 0];
  p2 = [0.5, 1, 0];
  intersection = quad.intersectWithLine(p1, p2, tol, x, pcoords);
  t.equal(
    intersection.intersect,
    QuadWithLineIntersectionState.NO_INTERSECTION
  );
  t.end();
});
