import { describe, expect, it } from 'vitest';

import vtkWebGPUPassTimer, {
  getTimestampWrites,
} from 'vtk.js/Sources/Rendering/WebGPU/PassTimer';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';

// A GPU that records the timer calls. mapAsync resolves with the given
// timestamps, in nanoseconds.
function createDevice(timestamps, features = ['timestamp-query']) {
  const calls = { resolve: [], copies: [], querySets: 0 };
  const handle = {
    createQuerySet: (descriptor) => {
      calls.querySets++;
      return { descriptor, destroy: () => {} };
    },
    createBuffer: (descriptor) => {
      const bytes = new ArrayBuffer(descriptor.size);
      return {
        descriptor,
        mapAsync: async () => {
          new BigUint64Array(bytes).set(timestamps.map((t) => BigInt(t)));
        },
        getMappedRange: (offset, size) => bytes.slice(offset, offset + size),
        unmap: () => {},
        destroy: () => {},
      };
    },
  };
  const device = {
    getHandle: () => handle,
    hasFeature: (name) => features.includes(name),
  };
  const commandEncoder = {
    passes: [],
    beginRenderPass(descriptor) {
      this.passes.push(descriptor);
      return {
        pushDebugGroup: () => {},
        popDebugGroup: () => {},
        end: () => {},
      };
    },
    resolveQuerySet: (...args) => calls.resolve.push(args),
    copyBufferToBuffer: (...args) => calls.copies.push(args),
  };
  return { device, commandEncoder, calls };
}

describe('vtkWebGPUPassTimer', () => {
  it('gives the times of the render passes of a frame', async () => {
    const { device, commandEncoder, calls } = createDevice([
      1000000, 3000000, 3000000, 3500000,
    ]);
    const timer = vtkWebGPUPassTimer.newInstance({ enabled: true });
    timer.beginFrame(device, commandEncoder);

    // Two render encoders record passes into the frame.
    for (const label of ['OpaquePass', 'VolumePass']) {
      const encoder = vtkWebGPURenderEncoder.newInstance({ label });
      encoder.setDescription({ colorAttachments: [] });
      encoder.begin(commandEncoder);
    }
    expect(commandEncoder.passes.map((p) => p.timestampWrites)).toEqual([
      expect.objectContaining({
        beginningOfPassWriteIndex: 0,
        endOfPassWriteIndex: 1,
      }),
      expect.objectContaining({
        beginningOfPassWriteIndex: 2,
        endOfPassWriteIndex: 3,
      }),
    ]);

    timer.endFrame();
    expect(calls.resolve[0].slice(1, 3)).toEqual([0, 4]);
    expect(calls.copies[0][4]).toBe(32);

    const results = new Promise((resolve) => {
      timer.onPassTimes(resolve);
    });
    timer.readResults();
    const times = await results;
    expect(times.passes).toEqual([
      { label: 'OpaquePass', ms: 2 },
      { label: 'VolumePass', ms: 0.5 },
    ]);
    expect(times.totalMs).toBe(2.5);
    expect(timer.getLastPassTimes()).toBe(times);

    // After the frame, the command encoder is not timed.
    expect(getTimestampWrites(commandEncoder, 'late')).toBe(undefined);
  });

  it('does not time a frame when it is disabled or not supported', () => {
    const disabled = createDevice([]);
    const timer = vtkWebGPUPassTimer.newInstance();
    timer.beginFrame(disabled.device, disabled.commandEncoder);
    expect(getTimestampWrites(disabled.commandEncoder, 'pass')).toBe(undefined);

    const unsupported = createDevice([], []);
    timer.setEnabled(true);
    timer.beginFrame(unsupported.device, unsupported.commandEncoder);
    expect(getTimestampWrites(unsupported.commandEncoder, 'pass')).toBe(
      undefined
    );
    timer.endFrame();
    expect(unsupported.calls.querySets).toBe(0);
  });

  it('stops giving timestamp writes when the frame is full', () => {
    const { device, commandEncoder } = createDevice([]);
    const timer = vtkWebGPUPassTimer.newInstance({
      enabled: true,
      maximumNumberOfPasses: 1,
    });
    timer.beginFrame(device, commandEncoder);
    expect(getTimestampWrites(commandEncoder, 'first')).toBeDefined();
    expect(getTimestampWrites(commandEncoder, 'second')).toBe(undefined);
  });
});
