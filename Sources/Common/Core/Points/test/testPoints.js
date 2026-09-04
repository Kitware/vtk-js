import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

it('Test vtkPoints instance', () => {
  expect(vtkPoints, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkPoints.newInstance({ size: 256 * 3 });
  expect(instance).toBeTruthy();
  expect(instance.getNumberOfComponents()).toBe(3);
  expect(instance.getNumberOfPoints()).toBe(256);
});

it('Test setPoint', () => {
  const points = vtkPoints.newInstance({ size: 256 * 3 });
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

it('Test incomplete point tuples are dropped', () => {
  const warnings = [];
  macro.setLoggerFunction('warn', (...args) => warnings.push(args.join(' ')));
  const points = vtkPoints.newInstance({
    numberOfComponents: 1,
    values: new Float32Array([1, 1, 1, 2, 2, 2, 3, 3, 3, 4]),
  });
  macro.setLoggerFunction('warn', console.warn);

  expect(warnings).toHaveLength(1);
  expect(points.getNumberOfComponents()).toBe(3);
  expect(points.getNumberOfPoints()).toBe(3);
  expect(points.getData()).toEqual(
    new Float32Array([1, 1, 1, 2, 2, 2, 3, 3, 3])
  );
  expect(points.getBounds()).toEqual([1, 3, 1, 3, 1, 3]);
});
