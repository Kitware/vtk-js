import test from 'tape';

import macro from 'vtk.js/Sources/macros';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

test.onlyIfWebGPU('Test vtkWebGPUTexture.writeSubImageData', async (t) => {
  const device = await testUtils.createWebGPUTestDevice();
  const texture = vtkWebGPUTexture.newInstance({ label: 'subImageTexture' });

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

    t.equal(
      actual.length,
      expected.length,
      'readback size matches texture size'
    );

    for (let i = 0; i < expected.length; i++) {
      t.equal(actual[i], expected[i], `byte ${i} matches expected value`);
    }
  } finally {
    texture.getHandle().destroy();
    device.getHandle().destroy();
  }
  t.end();
});

test.onlyIfWebGPU(
  'Test vtkWebGPUTexture.writeSubImageData rejects out-of-bounds writes',
  async (t) => {
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
      texture.writeSubImageData({
        x: 3,
        y: 3,
        width: 2,
        height: 2,
        nativeArray: patch,
      });

      const actual = await testUtils.readWebGPUTexture2D(device, texture, 4, 4);

      t.equal(errors.length, 1, 'out-of-bounds write logs one error');
      console.log(errors);
      t.ok(
        errors[0].includes('exceeds texture extent'),
        'error explains that the write region is out of bounds'
      );
      t.deepEqual(
        Array.from(actual),
        Array.from(basePixels),
        'texture contents remain unchanged after rejected write'
      );
    } finally {
      macro.setLoggerFunction('error', previousErrorLogger);
      texture.getHandle().destroy();
      device.getHandle().destroy();
    }
    t.end();
  }
);
