import { it, expect } from 'vitest';

it.skipIf(__VTK_TEST_NO_WEBGL__)('onlyIfWebGL', () => {
  expect(1).toBeTruthy();
});

it.skipIf(!__VTK_TEST_WEBGPU__)('onlyIfWebGPU', () => {
  expect(1).toBeTruthy();
});
