import { it, expect } from 'vitest';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import { compose } from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction/helpers';

function getNodeXs(fn) {
  const xs = [];
  const v = [0, 0, 0, 0, 0, 0]; // [x, r, g, b, midpoint, sharpness]
  for (let i = 0; i < fn.getSize(); i++) {
    fn.getNodeValue(i, v);
    xs.push(v[0]);
  }
  return xs;
}

it('Test compose with an identity transform passes colorFn through unchanged', () => {
  const identityFn = vtkPiecewiseFunction.newInstance();
  identityFn.addPoint(0, 0);
  identityFn.addPoint(100, 100);

  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPoint(0, 1, 0, 0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  compose([0, 100], [identityFn], colorFn, outputFn);

  expect(getNodeXs(outputFn)).toEqual([0, 100]);
  expect(outputFn.getRange()).toEqual([0, 100]);

  [0, 100].forEach((x) => {
    const expected = [];
    const actual = [];
    colorFn.getColor(x, expected);
    outputFn.getColor(x, actual);
    expect(actual).toEqual(expected);
  });
});

it('Test compose maps a color function breakpoint back to its source domain', () => {
  // y = x + 10
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 10);
  fn.addPoint(100, 110);

  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPoint(10, 1, 0, 0);
  colorFn.addRGBPoint(60, 0, 1, 0); // interior breakpoint -> maps back to x=50
  colorFn.addRGBPoint(110, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  compose([0, 100], [fn], colorFn, outputFn);

  const xs = getNodeXs(outputFn);
  expect(xs.length).toBe(3);
  expect(xs[0]).toBeCloseTo(0);
  expect(xs[1]).toBeCloseTo(50);
  expect(xs[2]).toBeCloseTo(100);

  xs.forEach((x) => {
    const finalScalar = fn.getValue(x);
    const expected = [];
    const actual = [];
    colorFn.getColor(finalScalar, expected);
    outputFn.getColor(x, actual);
    expect(actual).toEqual(expected);
  });
});

it('Test compose chains multiple transform functions and propagates breakpoints across stages', () => {
  // fn1: y = x * 0.5 over [0,100] -> output range [0,50]
  const fn1 = vtkPiecewiseFunction.newInstance();
  fn1.addPoint(0, 0);
  fn1.addPoint(100, 50);

  // fn2 takes fn1's output [0,50] and has an interior breakpoint at (25, 80)
  const fn2 = vtkPiecewiseFunction.newInstance();
  fn2.addPoint(0, 0);
  fn2.addPoint(25, 80);
  fn2.addPoint(50, 100);

  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPoint(0, 1, 0, 0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  compose([0, 100], [fn1, fn2], colorFn, outputFn);

  const xs = getNodeXs(outputFn);
  expect(xs.length).toBe(3);
  expect(xs[0]).toBeCloseTo(0);
  // fn2's interior breakpoint (x=25 in fn1's output domain) inverted through
  // fn1 lands at x=50 in the original data domain.
  expect(xs[1]).toBeCloseTo(50);
  expect(xs[2]).toBeCloseTo(100);

  xs.forEach((x) => {
    const finalScalar = fn2.getValue(fn1.getValue(x));
    const expected = [];
    const actual = [];
    colorFn.getColor(finalScalar, expected);
    outputFn.getColor(x, actual);
    expect(actual).toEqual(expected);
  });
});

it('Test compose clears previously composed points on subsequent calls', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(100, 100);

  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPoint(0, 1, 0, 0);
  colorFn.addRGBPoint(50, 0, 1, 0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  compose([0, 100], [fn], colorFn, outputFn);
  expect(outputFn.getSize()).toBe(3);

  colorFn.removeAllPoints();
  colorFn.addRGBPoint(0, 1, 1, 1);
  colorFn.addRGBPoint(100, 0, 0, 0);
  compose([0, 100], [fn], colorFn, outputFn);
  expect(outputFn.getSize()).toBe(2);
});
