import { it, expect } from 'vitest';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

it('Test vtkPlane instance', () => {
  expect(vtkPlane, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkPlane.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkPlane projectVector', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  // test where vector is out of plane
  const v = [1.0, 2.0, 3.0];
  const vProj = [];
  plane.projectVector(v, vProj);

  const correct = [1.0, 2.0, 0.0];
  for (let i = 0; i < 3; i++) {
    expect(vProj[i]).toBe(correct[i]);
  }

  // test where vector is in plane
  const v2 = [1.0, 2.0, 0.0];
  const v2Proj = [];
  plane.projectVector(v2, v2Proj);
  for (let i = 0; i < 3; i++) {
    expect(v2Proj[i]).toBe(correct[i]);
  }

  // test where vector is orthogonal to plane
  const v3 = [0.0, 0.0, 1.0];
  const v3Proj = [];
  plane.projectVector(v3, v3Proj);
  const correct3 = [0.0, 0.0, 0.0];
  for (let i = 0; i < 3; i++) {
    expect(v3Proj[i]).toBe(correct3[i]);
  }
});

it('Test vtkPlane projectPoint', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  const x = [1.0, 2.0, 3.0];
  const xProj = [];
  plane.projectVector(x, xProj);

  const correct = [1.0, 2.0, 0.0];
  for (let i = 0; i < 3; i++) {
    expect(xProj[i]).toBe(correct[i]);
  }
});

it('Test vtkPlane DistanceToPlane', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  const pt = [1.0, 2.0, 3.0];
  const distance = plane.distanceToPlane(pt);

  const correct = 3.0;
  expect(distance).toBe(correct);

  const pt2 = [1.0, 2.0, -3.0];
  const distance2 = plane.distanceToPlane(pt2);

  const correct2 = 3.0;
  expect(distance2).toBe(correct2);
});

it('Test vtkPlane Push', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  plane.push(3.0);

  const newOrigin = plane.getOrigin();
  const correct = [0.0, 0.0, 3.0];

  for (let i = 0; i < 3; i++) {
    expect(newOrigin[i]).toBe(correct[i]);
  }
});

it('Test vtkPlane intersectWithLine', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  // test where line is parallel to plane
  let p1 = [-1.0, 0.0, 3.0];
  let p2 = [2.0, 0.0, 3.0];
  let res = plane.intersectWithLine(p1, p2);
  expect(res.intersection).toBe(false);
  expect(res.t).toBe(Number.MAX_VALUE);
  expect(res.x.length).toBe(0);

  // test where line intersects plane
  p1 = [-1.0, 0.0, 1.0];
  p2 = [-1.0, 0.0, -1.0];
  res = plane.intersectWithLine(p1, p2);
  expect(res.intersection).toBe(true);
  expect(res.betweenPoints).toBe(true);
  expect(res.t).toBe(0.5);
  expect(res.x.length).toBe(3);
  let correct = [-1.0, 0.0, 0.0];
  for (let i = 0; i < 3; i++) {
    expect(res.x[i]).toBe(correct[i]);
  }

  // test where line intersects the plane outside of the provided points
  p1 = [-2.0, 0.0, -2.0];
  p2 = [2.0, 0.0, -1.0];
  res = plane.intersectWithLine(p1, p2);
  expect(res.intersection).toBe(true);
  expect(res.betweenPoints).toBe(false);
  expect(res.t).toBe(2);
  expect(res.x.length).toBe(3);
  correct = [6.0, 0.0, 0.0];
  for (let i = 0; i < 3; i++) {
    expect(res.x[i]).toBe(correct[i]);
  }
});

it('Test vtkPlane intersectWithPlane', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  // test where a plane is parallel to plane
  let origin = [2.0, 2.0, 2.0];
  let normal = [0.0, 0.0, 1.0];
  let res = plane.intersectWithPlane(origin, normal);
  expect(res.intersection).toBe(false);
  expect(res.error).toBe(vtkPlane.DISJOINT);
  expect(res.l0.length).toBe(0);
  expect(res.l1.length).toBe(0);

  // test where a plane is coplaner with plane
  origin = [1.0, 0.0, 0.0];
  normal = [0.0, 0.0, 1.0];
  res = plane.intersectWithPlane(origin, normal);
  expect(res.intersection).toBe(false);
  expect(res.error).toBe(vtkPlane.COINCIDE);

  // test where plane does intersect plane
  origin = [2.0, 0.0, 0.0];
  normal = [1.0, 0.0, 0.0];
  res = plane.intersectWithPlane(origin, normal);
  expect(res.intersection).toBe(true);
  expect(res.l0.length).toBe(3);
  expect(res.l1.length).toBe(3);
  const l0 = [2, 0, -0];
  const l1 = [2, -1, 0];
  for (let i = 0; i < 3; i++) {
    expect(res.l0[i]).toBe(l0[i]);
  }
  for (let i = 0; i < 3; i++) {
    expect(res.l1[i]).toBe(l1[i]);
  }
});

it('Test vtkPlane evaluateFunction', () => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(1.0, 1.0, 1.0);

  const point = [1.0, 1.0, 1.0];
  let res = plane.evaluateFunction(point);
  expect(res).toBe(3);

  res = plane.evaluateFunction(...point);
  expect(res).toBe(3);

  res = plane.evaluateFunction(...point, 1.0); // ignore last value
  expect(res).toBe(3);
});
