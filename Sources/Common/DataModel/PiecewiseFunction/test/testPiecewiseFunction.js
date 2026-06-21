import { it, expect } from 'vitest';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

it('Test findX on a simple linear function', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(10, 100);

  expect(fn.findX(50)).toBeCloseTo(5);
  expect(fn.findX(0)).toBeCloseTo(0);
  expect(fn.findX(100)).toBeCloseTo(10);
});

it('Test findX with multiple segments', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(5, 10);
  fn.addPoint(10, 10);

  // y === 10 is matched by the end of the first (rising) segment before the
  // flat segment is ever reached.
  expect(fn.findX(5)).toBeCloseTo(2.5);
  expect(fn.findX(10)).toBeCloseTo(5);
});

it('Test findX skips zero-slope (flat) segments', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 5);
  fn.addPoint(5, 5); // flat segment from x=0 to x=5
  fn.addPoint(10, 15);

  // y=5 is the degenerate value of the flat segment as well as the start of
  // the rising segment. The flat segment must be skipped to avoid a
  // divide-by-zero (NaN) result.
  expect(fn.findX(5)).toBeCloseTo(5);
});

it('Test findX on a decreasing function', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 100);
  fn.addPoint(10, 0);

  expect(fn.findX(50)).toBeCloseTo(5);
});

it('Test findX out-of-range with clamping on', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(10, 100);
  fn.setClamping(true);

  expect(fn.findX(-10)).toBe(0);
  expect(fn.findX(200)).toBe(10);
});

it('Test findX out-of-range with clamping off', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(10, 100);
  fn.setClamping(false);

  expect(fn.findX(-10)).toBeNull();
  expect(fn.findX(200)).toBeNull();
});

it('Test findX on an empty function', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  expect(fn.findX(0)).toBeNull();
});
