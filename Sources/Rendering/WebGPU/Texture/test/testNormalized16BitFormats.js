import { describe, expect, it } from 'vitest';

import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';

function createTexture(format, destroyed = []) {
  const writes = [];
  const handle = {
    createTexture: () => ({ destroy: () => destroyed.push(format) }),
    queue: {
      writeTexture: (...args) => writes.push(args),
    },
  };
  const texture = vtkWebGPUTexture.newInstance();
  texture.create(
    { getHandle: () => handle },
    { width: 2, height: 1, depth: 1, format, usage: 1 }
  );
  return { texture, writes };
}

describe('vtkWebGPUTexture normalized 16 bit formats', () => {
  it.each([
    ['r16snorm', Int16Array, [-32767, 1234], 32767],
    ['r16unorm', Uint16Array, [65535, 1234], 65535],
  ])(
    'uploads %s values without conversion',
    (format, ArrayType, values, scale) => {
      const { texture, writes } = createTexture(format);
      texture.writeImageData({
        nativeArray: new ArrayType(values),
        width: 2,
        height: 1,
        depth: 1,
      });

      expect(writes).toHaveLength(1);
      const upload = writes[0][1];
      expect(upload).toBeInstanceOf(ArrayType);
      expect(Array.from(upload.subarray(0, 2))).toEqual(values);
      expect(texture.getScale()).toBe(scale);
    }
  );

  it('destroys its GPU texture', () => {
    const destroyed = [];
    const { texture } = createTexture('r16float', destroyed);
    texture.destroy();

    expect(destroyed).toEqual(['r16float']);
    expect(texture.getHandle()).toBe(null);
  });
});
