import test from 'tape-catch';
import vtkBox from 'vtk.js/Sources/Common/DataModel/Box';

test('Test vtkBox instance', (t) => {
  t.ok(vtkBox, 'Make sure the class definition exists');
  const instance = vtkBox.newInstance();
  t.ok(instance);
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
