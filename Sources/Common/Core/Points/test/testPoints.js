import test from 'tape-catch';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

test('Test vtkPoints instance', (t) => {
  t.ok(vtkPoints, 'Make sure the class definition exists');
  const instance = vtkPoints.newInstance({ size: 256 });
  t.ok(instance);
  t.end();
});

test('Test setPoint', (t) => {
  const points = vtkPoints.newInstance({ size: 256 });
  const p = [1.0, 2.0, 3.0];
  const q = [];

  points.setPoint(0, p[0], p[1], p[2]);
  points.getPoint(0, q);
  t.deepEqual(p, q, 'setPoint with coords');

  // NOTE: This does not work!
  // points.setPoint(1, p);
  // points.getPoint(1, q);
  // t.deepEqual(p, q, 'setPoint with array');
  t.end();
});
