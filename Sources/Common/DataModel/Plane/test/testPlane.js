import test from 'tape-catch';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

test('Test vtkPlane instance', (t) => {
  t.ok(vtkPlane, 'Make sure the class definition exists');
  const instance = vtkPlane.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkPlane projectVector', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  // test where vector is out of plane
  const v = [1.0, 2.0, 3.0];
  const vProj = [];
  plane.projectVector(v, vProj);

  const correct = [1.0, 2.0, 0.0];
  for (let i = 0; i < 3; i++) {
    t.equal(vProj[i], correct[i]);
  }

  // test where vector is in plane
  const v2 = [1.0, 2.0, 0.0];
  const v2Proj = [];
  plane.projectVector(v2, v2Proj);
  for (let i = 0; i < 3; i++) {
    t.equal(v2Proj[i], correct[i]);
  }

  // test where vector is orthogonal to plane
  const v3 = [0.0, 0.0, 1.0];
  const v3Proj = [];
  plane.projectVector(v3, v3Proj);
  const correct3 = [0.0, 0.0, 0.0];
  for (let i = 0; i < 3; i++) {
    t.equal(v3Proj[i], correct3[i]);
  }
  t.end();
});

test('Test vtkPlane projectPoint', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  const x = [1.0, 2.0, 3.0];
  const xProj = [];
  plane.projectVector(x, xProj);

  const correct = [1.0, 2.0, 0.0];
  for (let i = 0; i < 3; i++) {
    t.equal(xProj[i], correct[i]);
  }

  t.end();
});

test('Test vtkPlane DistanceToPlane', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  const pt = [1.0, 2.0, 3.0];
  const distance = plane.distanceToPlane(pt);

  const correct = 3.0;
  t.equal(distance, correct);

  const pt2 = [1.0, 2.0, -3.0];
  const distance2 = plane.distanceToPlane(pt2);

  const correct2 = 3.0;
  t.equal(distance2, correct2);

  t.end();
});

test('Test vtkPlane Push', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  plane.push(3.0);

  const newOrigin = plane.getOrigin();
  const correct = [0.0, 0.0, 3.0];

  for (let i = 0; i < 3; i++) {
    t.equal(newOrigin[i], correct[i]);
  }

  t.end();
});

test('Test vtkPlane intersectWithLine', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(0.0, 0.0, 1.0);

  // test where line is parallel to plane
  let p1 = [-1.0, 0.0, 3.0];
  let p2 = [2.0, 0.0, 3.0];
  let res = plane.intersectWithLine(p1, p2);
  t.equal(res.intersection, false);
  t.equal(res.t, Number.MAX_VALUE);
  t.equal(res.x.length, 0);

  // test where line intersects plane
  p1 = [-1.0, 0.0, 1.0];
  p2 = [-1.0, 0.0, -1.0];
  res = plane.intersectWithLine(p1, p2);
  t.equal(res.intersection, true);
  t.equal(res.t, 0.5);
  t.equal(res.x.length, 3);
  let correct = [-1.0, 0.0, 0.0];
  for (let i = 0; i < 3; i++) {
    t.equal(res.x[i], correct[i]);
  }

  // test where line does not intersect plane
  p1 = [-2.0, 0.0, -2.0];
  p2 = [2.0, 0.0, -1.0];
  res = plane.intersectWithLine(p1, p2);
  t.equal(res.intersection, false);
  t.equal(res.t, 2);
  t.equal(res.x.length, 3);
  correct = [6.0, 0.0, 0.0];
  for (let i = 0; i < 3; i++) {
    t.equal(res.x[i], correct[i]);
  }

  t.end();
});

test('Test vtkPlane evaluateFunction', (t) => {
  const plane = vtkPlane.newInstance();
  plane.setOrigin(0.0, 0.0, 0.0);
  plane.setNormal(1.0, 1.0, 1.0);

  const point = [1.0, 1.0, 1.0];
  let res = plane.evaluateFunction(point);
  t.equal(res, 3);

  res = plane.evaluateFunction(...point);
  t.equal(res, 3);

  res = plane.evaluateFunction(...point, 1.0); // ignore last value
  t.equal(res, 3);

  t.end();
});
