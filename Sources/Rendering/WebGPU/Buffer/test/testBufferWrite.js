import { describe, expect, it } from 'vitest';

import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';

// A GPU device that records buffer creations and copies. Like Chrome, it
// rejects a buffer mapped at creation with a size that is not a multiple of 4.
function createDevice() {
  const buffers = [];
  const copies = [];
  const handle = {
    createBuffer: (descriptor) => {
      if (descriptor.mappedAtCreation && descriptor.size % 4 !== 0) {
        throw new RangeError('size is not a multiple of 4');
      }
      const bytes = new Uint8Array(descriptor.size);
      const buffer = {
        descriptor,
        bytes,
        getMappedRange: () => bytes.buffer,
        unmap: () => {},
        destroy: () => {},
      };
      buffers.push(buffer);
      return buffer;
    },
    createCommandEncoder: () => ({
      copyBufferToBuffer: (src, srcOffset, dst, dstOffset, size) => {
        copies.push({ src, dst, size });
        dst.bytes.set(
          src.bytes.subarray(srcOffset, srcOffset + size),
          dstOffset
        );
      },
      finish: () => ({}),
    }),
    queue: { submit: () => {} },
  };
  return { device: { getHandle: () => handle }, buffers, copies };
}

describe('vtkWebGPUBuffer writes', () => {
  it('writes a byte count that is not a multiple of 4', () => {
    const { device, buffers, copies } = createDevice();
    const buffer = vtkWebGPUBuffer.newInstance();
    buffer.setDevice(device);
    buffer.create(6, 0);

    expect(() =>
      buffer.write(new Uint8Array([1, 2, 3, 4, 5, 6]))
    ).not.toThrow();
    expect(buffers[0].descriptor.size).toBe(8);
    expect(buffer.getSizeInBytes()).toBe(6);
    expect(copies[0].size).toBe(8);
    expect(Array.from(buffers[0].bytes.subarray(0, 6))).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it('writes only the bytes of a subarray', () => {
    const { device, buffers } = createDevice();
    const source = new Float32Array([1, 2, 3, 4, 5, 6]);
    const view = source.subarray(2, 4);

    const writeBuffer = vtkWebGPUBuffer.newInstance();
    writeBuffer.setDevice(device);
    writeBuffer.create(view.byteLength, 0);
    writeBuffer.write(view);
    expect(Array.from(new Float32Array(buffers[0].bytes.buffer))).toEqual([
      3, 4,
    ]);

    const createdBuffer = vtkWebGPUBuffer.newInstance();
    createdBuffer.setDevice(device);
    createdBuffer.createAndWrite(view, 0);
    const created = buffers[buffers.length - 1];
    expect(created.descriptor.size).toBe(8);
    expect(Array.from(new Float32Array(created.bytes.buffer))).toEqual([3, 4]);
  });
});
