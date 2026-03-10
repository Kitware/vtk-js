import { it, expect } from 'vitest';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

it('Test vtkPoints instance', () => {
  expect(vtkPoints, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkPoints.newInstance({ size: 256 });
  expect(instance).toBeTruthy();
});

it('Test setPoint', () => {
  const points = vtkPoints.newInstance({ size: 256 });
  const p = [1.0, 2.0, 3.0];
  const q = [];

  points.setPoint(0, p[0], p[1], p[2]);
  points.getPoint(0, q);
  expect(p, 'setPoint with coords').toEqual(q);

  // NOTE: This does not work!
  // points.setPoint(1, p);
  // points.getPoint(1, q);
  // expect(p).toEqual(q);
});
