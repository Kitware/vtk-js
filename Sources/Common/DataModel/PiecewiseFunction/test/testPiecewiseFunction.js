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

it('Test findX on a flat (zero-slope) segment', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 5);
  fn.addPoint(5, 5); // flat segment from x=0 to x=5
  fn.addPoint(10, 15);

  // Every x on the plateau evaluates to 5, so the inverse is non-unique;
  // the first matching node in scan order (the plateau's left edge) is
  // returned.
  expect(fn.findX(5)).toBe(0);
  expect(fn.getValue(fn.findX(5))).toBe(5);
  // Values above the plateau invert through the rising segment.
  expect(fn.findX(10)).toBeCloseTo(7.5);
});

it('Test findX on a decreasing function', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 100);
  fn.addPoint(10, 0);

  expect(fn.findX(50)).toBeCloseTo(5);
});

it('Test findX on a decreasing shaped segment (round trip)', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPointLong(0, 100, 0.25, 0.5); // non-default midpoint and sharpness
  fn.addPoint(10, 0);

  [90, 50, 10].forEach((y) => {
    expect(fn.getValue(fn.findX(y))).toBeCloseTo(y);
  });
});

it('Test findX on a non-monotonic function', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  // Rise, fall, rise: 40 -> 100 -> 0 -> 60. The falling segment is shaped
  // by a non-default midpoint and sharpness so its inverse must go
  // through bisection, not endpoint interpolation.
  fn.addPoint(0, 40);
  fn.addPointLong(4, 100, 0.3, 0.6);
  fn.addPoint(6, 0);
  fn.addPoint(10, 60);

  // y = 70 has a pre-image in both rising segments and the falling one;
  // the leftmost bracketing segment (the linear rise on [0, 4]) wins.
  expect(fn.findX(70)).toBeCloseTo(2);

  // y = 20 is below the first segment's range, so the falling shaped
  // segment on [4, 6] is the leftmost match — not the final rise, which
  // also attains 20 (at x ≈ 7.33).
  const x20 = fn.findX(20);
  expect(x20).toBeGreaterThan(4);
  expect(x20).toBeLessThan(6);
  expect(fn.getValue(x20)).toBeCloseTo(20);

  // Node values are returned exactly, including the interior extremes.
  expect(fn.findX(100)).toBe(4);
  expect(fn.findX(0)).toBe(6);

  // Round trips hold across the whole output range.
  [5, 20, 45, 70, 95].forEach((y) => {
    expect(fn.getValue(fn.findX(y))).toBeCloseTo(y);
  });
});

it('Test findX honors a non-default midpoint', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  // The segment shape is controlled by the leading node's midpoint and
  // sharpness: the curve reaches (y0 + y1) / 2 at 25% of the segment.
  fn.addPointLong(0, 0, 0.25, 0);
  fn.addPoint(10, 100);

  expect(fn.findX(50)).toBeCloseTo(2.5);
  expect(fn.getValue(fn.findX(50))).toBeCloseTo(50);
  expect(fn.getValue(fn.findX(80))).toBeCloseTo(80);
});

it('Test findX honors sharpness (round trip through forward evaluation)', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPointLong(0, 0, 0.5, 0.5);
  fn.addPoint(10, 100);

  [10, 30, 50, 70, 90].forEach((y) => {
    expect(fn.getValue(fn.findX(y))).toBeCloseTo(y);
  });
});

it('Test findX returns the jump location for a piecewise-constant segment', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPointLong(0, 0, 0.5, 1.0); // sharpness 1: step at the midpoint
  fn.addPoint(10, 100);

  // No x evaluates to 50; the discontinuity at x=5 is returned.
  expect(fn.findX(50)).toBeCloseTo(5);
  // The whole run [5, 10] evaluates to 100; its leftmost x — the jump —
  // wins over the node at x=10.
  expect(fn.findX(100)).toBeCloseTo(5);
  expect(fn.findX(0)).toBe(0);
});

it('Test findX finds the jump of a decreasing step', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPointLong(0, 100, 0.3, 1.0); // steps down at 30% along: x=3
  fn.addPoint(10, 0);

  expect(fn.getValue(2.99)).toBe(100);
  expect(fn.getValue(3)).toBe(0);
  // The run [3, 10] evaluates to 0, so its left edge — the jump — wins.
  // A probe landing exactly on y has to move the upper bound here just
  // as it does on a rising step, or this resolves to x=10 instead.
  expect(fn.findX(0)).toBeCloseTo(3);
  expect(fn.findX(50)).toBeCloseTo(3);
});

it('Test findX finds the jump of a step with a non-default midpoint', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  // sharpness 1 steps at the node's midpoint: 30% along the segment.
  fn.addPointLong(0, 0, 0.3, 1.0);
  fn.addPoint(10, 100);

  // The jump sits at x=3, not at the segment's centre.
  expect(fn.getValue(2.99)).toBe(0);
  expect(fn.getValue(3)).toBe(100);
  expect(fn.findX(100)).toBeCloseTo(3);
  expect(fn.findX(50)).toBeCloseTo(3);
});

it('Test findX out-of-range with clamping on', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(10, 100);
  fn.setClamping(true);

  expect(fn.findX(-10)).toBe(0);
  expect(fn.findX(200)).toBe(10);
});

it('Test findX out-of-range on a decreasing function with clamping on', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 100);
  fn.addPoint(10, 0);
  fn.setClamping(true);

  // The maximum output (100) is attained at x=0, the minimum (0) at x=10.
  expect(fn.findX(200)).toBe(0);
  expect(fn.findX(-10)).toBe(10);
});

it('Test findX out-of-range on a non-monotonic function with clamping on', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 0);
  fn.addPoint(5, 100); // interior maximum
  fn.addPoint(10, 20);
  fn.setClamping(true);

  // Above the output range: the maximum is only attained at an interior
  // node, so no x clamps to y (forward evaluation clamps to endpoint
  // values only).
  expect(fn.findX(200)).toBeNull();
  // Below the output range: the minimum is attained at an endpoint.
  expect(fn.findX(-10)).toBe(0);
});

it('Test findX out-of-range when an endpoint shares the interior extremum', () => {
  const fn = vtkPiecewiseFunction.newInstance();
  fn.addPoint(0, 100);
  fn.addPoint(5, 100); // interior node ties the endpoint maximum
  fn.addPoint(10, 0);
  fn.setClamping(true);

  // The maximum is attained at an endpoint, so it remains a valid clamp
  // target even though an interior node shares the same value.
  expect(fn.findX(200)).toBe(0);
  expect(fn.findX(-10)).toBe(10);
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
