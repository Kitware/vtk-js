import { it, expect } from 'vitest';

import macro from 'vtk.js/Sources/macros';
import HalfFloat from 'vtk.js/Sources/Common/Core/HalfFloat';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

it('packs an Int16 RGBA source extent directly into aligned rows', () => {
  const writes = [];
  const handle = {
    createTexture: () => ({}),
    queue: {
      writeTexture: (...args) => writes.push(args),
    },
  };
  const device = { getHandle: () => handle };
  const texture = vtkWebGPUTexture.newInstance();
  texture.create(device, {
    width: 4,
    height: 3,
    depth: 2,
    format: 'rgba16float',
    usage: 1,
  });

  const source = new Int16Array(4 * 3 * 2 * 4);
  for (let i = 0; i < source.length; i++) {
    source[i] = i;
  }

  const writeSucceeded = texture.writeSubImageData({
    x: 1,
    y: 1,
    z: 0,
    width: 2,
    height: 2,
    depth: 2,
    nativeArray: source,
    sourceLayout: {
      width: 4,
      height: 3,
      depth: 2,
      x: 1,
      y: 1,
      z: 0,
    },
  });

  expect(writeSucceeded).toBe(true);
  expect(writes).toHaveLength(1);
  const upload = writes[0][1];
  const layout = writes[0][2];
  expect(layout.bytesPerRow).toBe(256);
  expect(layout.rowsPerImage).toBe(2);
  expect(upload).toHaveLength(128 * 4);

  const expectedRows = [20, 36, 68, 84];
  for (let row = 0; row < expectedRows.length; row++) {
    const sourceOffset = expectedRows[row];
    const uploadOffset = row * 128;
    for (let component = 0; component < 8; component++) {
      expect(upload[uploadOffset + component]).toBe(
        HalfFloat.toHalf(source[sourceOffset + component])
      );
    }
  }
});

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTexture.writeSubImageData',
  async () => {
    const device = await testUtils.createWebGPUTestDevice();
    const texture = vtkWebGPUTexture.newInstance({ label: 'subImageTexture' });

    texture.create(device, {
      width: 4,
      height: 4,
      format: 'rgba8unorm',
      usage:
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        GPUTextureUsage.TEXTURE_BINDING |
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        GPUTextureUsage.COPY_DST |
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        GPUTextureUsage.COPY_SRC,
    });

    const basePixels = new Uint8Array(4 * 4 * 4);
    for (let i = 0; i < 16; i++) {
      basePixels[i * 4 + 3] = 255;
    }
    texture.writeImageData({ nativeArray: basePixels });

    const patch = new Uint8Array([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
    ]);
    texture.writeSubImageData({
      x: 1,
      y: 1,
      width: 2,
      height: 2,
      nativeArray: patch,
    });

    const actual = await testUtils.readWebGPUTexture2D(device, texture, 4, 4);

    const expected = new Uint8Array(basePixels);
    const setPixel = (x, y, rgba) => {
      expected.set(rgba, (y * 4 + x) * 4);
    };
    setPixel(1, 1, [255, 0, 0, 255]);
    setPixel(2, 1, [0, 255, 0, 255]);
    setPixel(1, 2, [0, 0, 255, 255]);
    setPixel(2, 2, [255, 255, 0, 255]);

    expect(actual.length, 'readback size matches texture size').toBe(
      expected.length
    );

    for (let i = 0; i < expected.length; i++) {
      expect(actual[i], `byte ${i} matches expected value`).toBe(expected[i]);
    }
  }
);

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTexture.writeSubImageData rejects writes outside the bounds',
  async () => {
    const device = await testUtils.createWebGPUTestDevice();
    const texture = vtkWebGPUTexture.newInstance({
      label: 'subImageTextureOutOfBounds',
    });
    const errors = [];
    const previousErrorLogger = console.error;

    macro.setLoggerFunction('error', (...args) => {
      errors.push(args.join(' '));
    });

    try {
      texture.create(device, {
        width: 4,
        height: 4,
        format: 'rgba8unorm',
        usage:
          /* eslint-disable no-undef */
          /* eslint-disable no-bitwise */
          GPUTextureUsage.TEXTURE_BINDING |
          /* eslint-disable no-undef */
          /* eslint-disable no-bitwise */
          GPUTextureUsage.COPY_DST |
          /* eslint-disable no-undef */
          /* eslint-disable no-bitwise */
          GPUTextureUsage.COPY_SRC,
      });

      const basePixels = new Uint8Array(4 * 4 * 4);
      for (let i = 0; i < 16; i++) {
        basePixels[i * 4 + 3] = 255;
      }
      texture.writeImageData({ nativeArray: basePixels });

      const patch = new Uint8Array([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
      ]);
      const writeSucceeded = texture.writeSubImageData({
        x: 3,
        y: 3,
        width: 2,
        height: 2,
        nativeArray: patch,
      });

      const actual = await testUtils.readWebGPUTexture2D(device, texture, 4, 4);

      expect(errors.length, 'write outside the bounds logs one error').toBe(1);
      expect(writeSucceeded, 'write outside the bounds reports failure').toBe(
        false
      );
      console.log(errors);
      expect(
        errors[0].includes('exceeds texture extent'),
        'error explains that the write region is out of bounds'
      ).toBeTruthy();
      expect(
        Array.from(actual),
        'texture contents remain unchanged after rejected write'
      ).toEqual(Array.from(basePixels));
    } finally {
      macro.setLoggerFunction('error', previousErrorLogger);
    }
  }
);
