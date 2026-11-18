import { it, expect } from 'vitest';

import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';

const { fromHalf, needsHalfFloatClamp, toHalf, toHalfClamped } = HalfFloat;

it('converts values beyond the half float range to infinity of the same sign', () => {
  expect(toHalf(65519)).toBe(0x7bff);
  expect(toHalf(65520)).toBe(0x7c00);
  expect(toHalf(-65520)).toBe(0xfc00);
  expect(toHalf(70000)).toBe(0x7c00);
  expect(toHalf(-70000)).toBe(0xfc00);
  expect(toHalf(1e38)).toBe(0x7c00);
  expect(toHalf(-1e38)).toBe(0xfc00);
});

it('keeps infinity and NaN', () => {
  expect(fromHalf(toHalf(Infinity))).toBe(Infinity);
  expect(fromHalf(toHalf(-Infinity))).toBe(-Infinity);
  expect(fromHalf(toHalf(NaN))).toBeNaN();
});

it('clamps finite values to the largest finite half float', () => {
  expect(HalfFloat.MAX_FINITE_HALF_FLOAT).toBe(65504);
  expect(toHalfClamped(65504)).toBe(0x7bff);
  expect(toHalfClamped(65520)).toBe(0x7bff);
  expect(toHalfClamped(65535)).toBe(0x7bff);
  expect(toHalfClamped(-65520)).toBe(0xfbff);
  expect(toHalfClamped(-70000)).toBe(0xfbff);
  expect(toHalfClamped(1e300)).toBe(0x7bff);
  expect(toHalfClamped(-0)).toBe(0x8000);
  expect(toHalfClamped(1024.5)).toBe(toHalf(1024.5));
  expect(fromHalf(toHalfClamped(-3))).toBe(-3);
});

it('does not clamp infinity or NaN', () => {
  expect(fromHalf(toHalfClamped(Infinity))).toBe(Infinity);
  expect(fromHalf(toHalfClamped(-Infinity))).toBe(-Infinity);
  expect(fromHalf(toHalfClamped(NaN))).toBeNaN();
});

it('reports which values toHalfClamped clamps', () => {
  for (const value of [65505, 65535, -65505, -70000, 1e300]) {
    expect(needsHalfFloatClamp(value)).toBe(true);
  }
  for (const value of [0, -0, 65504, -65504, 1, Infinity, -Infinity, NaN]) {
    expect(needsHalfFloatClamp(value)).toBe(false);
  }
});
