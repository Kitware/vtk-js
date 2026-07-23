import { it, expect } from 'vitest';
import macro from 'vtk.js/Sources/macros';
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
  // All-linear composition is exact: the measured error is (falsy!) 0,
  // so success must be tested against null, never truthiness.
  const maxError = compose([identityFn], colorFn, outputFn);
  expect(maxError).not.toBeNull();
  expect(maxError).toBeLessThan(1e-10);

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
  compose([fn], colorFn, outputFn);

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
  compose([fn1, fn2], colorFn, outputFn);

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

it('Test compose fails early when a transform function is not monotonic', () => {
  const fn1 = vtkPiecewiseFunction.newInstance();
  fn1.addPoint(0, 0);
  fn1.addPoint(100, 100);

  // Non-monotonic (Varied) transform: breakpoints cannot be pulled back
  // through it unambiguously.
  const fn2 = vtkPiecewiseFunction.newInstance();
  fn2.addPoint(0, 0);
  fn2.addPoint(50, 100);
  fn2.addPoint(100, 20);

  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPoint(0, 1, 0, 0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  outputFn.addRGBPoint(42, 1, 1, 1); // pre-existing content must survive

  const warnings = [];
  macro.setLoggerFunction('warn', (...args) => warnings.push(args.join(' ')));
  try {
    expect(compose([fn1, fn2], colorFn, outputFn)).toBeNull();
  } finally {
    macro.setLoggerFunction('warn', console.warn);
  }

  // Failed composition leaves outputFn untouched and reports the culprit.
  expect(getNodeXs(outputFn)).toEqual([42]);
  expect(warnings.length).toBe(1);
  expect(warnings[0]).toContain('index 1');
  expect(warnings[0]).toContain('not monotonic');
});

it('Test compose rejects a shaped transform without a threshold but subdivides with one', () => {
  // Piecewise linear despite the shaped LAST node: its midpoint and
  // sharpness would only affect a transition to a following node that
  // does not exist, so it must not trip the check.
  const fn1 = vtkPiecewiseFunction.newInstance();
  fn1.addPoint(0, 0);
  fn1.addPointLong(100, 100, 0.3, 0.6);

  // Shaped interior segment: the composed result interpolates linearly
  // between breakpoints and cannot reproduce it.
  const fn2 = vtkPiecewiseFunction.newInstance();
  fn2.addPointLong(0, 0, 0.3, 0.6);
  fn2.addPoint(100, 100);

  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPoint(0, 1, 0, 0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  outputFn.addRGBPoint(42, 1, 1, 1); // pre-existing content must survive

  const warnings = [];
  macro.setLoggerFunction('warn', (...args) => warnings.push(args.join(' ')));
  try {
    expect(compose([fn1, fn2], colorFn, outputFn)).toBeNull();
    // Failed composition leaves outputFn untouched and reports the culprit.
    expect(getNodeXs(outputFn)).toEqual([42]);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('index 1');
    expect(warnings[0]).toContain('not piecewise linear');

    // With the offending function removed, the shaped last node alone
    // composes fine.
    expect(compose([fn1], colorFn, outputFn)).not.toBeNull();

    // With an errorThreshold, the shaped transform is admitted and its
    // non-linearity is captured through subdivision: the returned error
    // meets the threshold.
    const threshold = 0.01;
    const subdividedFn = vtkColorTransferFunction.newInstance();
    const maxError = compose([fn1, fn2], colorFn, subdividedFn, threshold);
    expect(maxError).not.toBeNull();
    expect(maxError).toBeLessThanOrEqual(threshold);
    expect(subdividedFn.getSize()).toBeGreaterThan(2);
    const xs = getNodeXs(subdividedFn);
    for (let i = 0; i + 1 < xs.length; i++) {
      const xm = 0.5 * (xs[i] + xs[i + 1]);
      const expected = [];
      const actual = [];
      colorFn.getColor(fn2.getValue(fn1.getValue(xm)), expected);
      subdividedFn.getColor(xm, actual);
      expected.forEach((channel, c) => {
        expect(Math.abs(actual[c] - channel)).toBeLessThanOrEqual(
          threshold + 1e-6
        );
      });
    }
  } finally {
    macro.setLoggerFunction('warn', console.warn);
  }
});

it('Test compose subdivides output segments to meet an error threshold', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(100, 100);

  // Strongly shaped (non-linear) color segment.
  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPointLong(0, 1, 0, 0, 0.25, 0.9);
  colorFn.addRGBPoint(100, 0, 0, 1);

  // Without a threshold the shaped segment is linearized between the two
  // breakpoints, and the returned error reports the (large) deviation.
  const threshold = 0.01;
  const flatFn = vtkColorTransferFunction.newInstance();
  const flatError = compose([fn], colorFn, flatFn);
  expect(flatFn.getSize()).toBe(2);
  expect(flatError).toBeGreaterThan(threshold);

  // With a threshold, interior nodes are added until the error meets it.
  const outputFn = vtkColorTransferFunction.newInstance();
  const maxError = compose([fn], colorFn, outputFn, threshold);
  expect(maxError).not.toBeNull();
  expect(maxError).toBeLessThanOrEqual(threshold);
  expect(outputFn.getSize()).toBeGreaterThan(2);

  // Between every adjacent pair of output nodes, the composed (linear)
  // interpolation at the midpoint matches the true color on every channel
  // to within the threshold.
  const xs = getNodeXs(outputFn);
  for (let i = 0; i + 1 < xs.length; i++) {
    const xm = 0.5 * (xs[i] + xs[i + 1]);
    const expected = [];
    const actual = [];
    colorFn.getColor(fn.getValue(xm), expected);
    outputFn.getColor(xm, actual);
    expected.forEach((channel, c) => {
      expect(Math.abs(actual[c] - channel)).toBeLessThanOrEqual(
        threshold + 1e-6
      );
    });
  }
});

it('Test compose returns the maximum measured midpoint error across segments', () => {
  // Two linear transform segments of different slopes.
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(50, 25);
  fn.addPoint(100, 100);

  // Shaped color segment over [0, 25], linear over [25, 100]: only the
  // first composed segment deviates from linear interpolation.
  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPointLong(0, 1, 0, 0, 0.25, 0.9);
  colorFn.addRGBPoint(25, 0, 1, 0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  const maxError = compose([fn], colorFn, outputFn);
  expect(maxError).not.toBeNull();

  // Breakpoints: fn's nodes plus colorFn's node at 25 pulled back to 50.
  expect(getNodeXs(outputFn)).toEqual([0, 50, 100]);

  // Recompute each segment's midpoint deviation independently through
  // forward evaluation.
  const deviation = (x0, x1) => {
    const xm = 0.5 * (x0 + x1);
    const cm = [];
    const c0 = [];
    const c1 = [];
    colorFn.getColor(fn.getValue(xm), cm);
    colorFn.getColor(fn.getValue(x0), c0);
    colorFn.getColor(fn.getValue(x1), c1);
    return cm.reduce(
      (max, c, i) => Math.max(max, Math.abs(c - 0.5 * (c0[i] + c1[i]))),
      0
    );
  };
  const first = deviation(0, 50);
  const second = deviation(50, 100);

  // The shaped segment comes first and dominates; an implementation
  // returning the last measured deviation instead of the maximum would
  // report ~0.
  expect(first).toBeGreaterThan(0.1);
  expect(second).toBeLessThan(1e-10);
  expect(maxError).toBeCloseTo(first, 12);
});

it('Test compose subdivision terminates on a discontinuous color segment', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(100, 100);

  // sharpness 1: a step at the segment midpoint. The midpoint criterion
  // can never be met across the jump, so only the depth cap stops the
  // recursion there.
  const colorFn = vtkColorTransferFunction.newInstance();
  colorFn.addRGBPointLong(0, 1, 0, 0, 0.5, 1.0);
  colorFn.addRGBPoint(100, 0, 0, 1);

  const outputFn = vtkColorTransferFunction.newInstance();
  const maxError = compose([fn], colorFn, outputFn, 0.01);
  // The returned error exceeding the threshold tells the caller the
  // depth cap stopped refinement (nothing can converge across a jump).
  expect(maxError).toBeGreaterThan(0.01);

  const size = outputFn.getSize();
  expect(size).toBeGreaterThan(2);
  // Node growth stays bounded: roughly two nodes per recursion level
  // funneling toward the jump, not an explosion.
  expect(size).toBeLessThan(60);

  // A caller-supplied depth cap tightens the bound further.
  const shallowFn = vtkColorTransferFunction.newInstance();
  expect(compose([fn], colorFn, shallowFn, 0.01, 3)).toBeGreaterThan(0.01);
  expect(shallowFn.getSize()).toBeGreaterThan(2);
  // Depth 3 allows at most 2^3 - 1 = 7 extra nodes per segment.
  expect(shallowFn.getSize()).toBeLessThanOrEqual(2 + 7);
  expect(shallowFn.getSize()).toBeLessThan(size);
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
  compose([fn], colorFn, outputFn);
  expect(outputFn.getSize()).toBe(3);

  colorFn.removeAllPoints();
  colorFn.addRGBPoint(0, 1, 1, 1);
  colorFn.addRGBPoint(100, 0, 0, 0);
  compose([fn], colorFn, outputFn);
  expect(outputFn.getSize()).toBe(2);
});
