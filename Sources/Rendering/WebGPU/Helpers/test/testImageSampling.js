import { expect, it } from 'vitest';

import { computeFnToString } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/ImageSampling';

function createTransferFunction(mtime) {
  return {
    getMTime: () => mtime,
    getRange: () => [0, 1],
  };
}

it('includes transfer functions from every component in the cache key', () => {
  const propertyA = {
    getTransferFunction(component) {
      return component === 1 ? createTransferFunction(1) : null;
    },
  };
  const propertyB = {
    getTransferFunction(component) {
      return component === 1 ? createTransferFunction(2) : null;
    },
  };

  const keyA = computeFnToString(propertyA, propertyA.getTransferFunction, 2);
  const keyB = computeFnToString(propertyB, propertyB.getTransferFunction, 2);

  expect(keyA).not.toBe(keyB);
  expect(keyA).toContain('none-1:0,1');
});
