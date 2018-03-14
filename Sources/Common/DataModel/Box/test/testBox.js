import test from 'tape-catch';
import vtkBox from 'vtk.js/Sources/Common/DataModel/Box';

test('Test vtkBox instance', (t) => {
  t.ok(vtkBox, 'Make sure the class definition exists');
  const instance = vtkBox.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkBox intersectBox', (t) => {
  const bounds = [-50, 50, -50, 50, -50, 50];
  const orig = [100, 0, 0];
  const dir = [-100, 0, 0];
  let coord = [];
  const tol = [];

  // Orig outside and intersect with dir
  const hit = vtkBox.intersectBox(bounds, orig, dir, coord, tol);
  t.equal(hit, 1);
  t.equal(coord[0], 50);
  t.equal(coord[1], 0);
  t.equal(coord[2], 0);
  t.equal(tol[0], 0.5);

  // Orig outside and doesn't intersect with dir
  dir[0] = 100;
  coord = [];
  const hit2 = vtkBox.intersectBox(bounds, orig, dir, coord, tol);
  t.equal(hit2, 0);

  // Orig inside bounds
  orig[0] = 0.0;
  orig[1] = 0.0;
  orig[2] = 0.0;
  coord = [];
  const hit3 = vtkBox.intersectBox(bounds, orig, dir, coord, tol);
  t.equal(hit3, 1);
  t.equal(coord[0], orig[0]);
  t.equal(coord[1], orig[1]);
  t.equal(coord[2], orig[2]);
  t.equal(tol[0], 0);

  t.end();
});

test('Test vtkBox bounds', (t) => {
  const box = vtkBox.newInstance();

  // Test setting of bounds
  const bounds = [-50, 50, -50, 50, -50, 50];
  box.setBounds(bounds);
  const newBounds = box.getBounds();
  for (let i = 0; i < bounds.length; i++) {
    t.equal(newBounds[i], bounds[i]);
  }

  t.end();
});

test('Test vtkBox evaluateFunction', (t) => {
  const bounds = [-50, 50, -50, 50, -50, 50];
  const box = vtkBox.newInstance();
  box.setBounds(bounds);

  let point = [0.0, 0.0, 0.0];
  let res = box.evaluateFunction(point);
  t.equal(res, -50);

  point = [100.0, 0.0, 0.0];
  res = box.evaluateFunction(point);
  t.equal(res, 50);

  point = [50.0, 0.0, 0.0];
  res = box.evaluateFunction(point);
  t.equal(res, 0);

  res = box.evaluateFunction(...point);
  t.equal(res, 0);

  t.end();
});
