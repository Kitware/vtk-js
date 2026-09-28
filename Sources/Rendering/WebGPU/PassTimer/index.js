import macro from 'vtk.js/Sources/macros';

// The timer of the frame that each command encoder records.
const encoderTimers = new WeakMap();

// Each pass writes two timestamps of 8 bytes.
const BYTES_PER_PASS = 16;

// Frames whose results are not read yet. Frames after this number are not
// timed, so that the readback does not use more memory.
const MAXIMUM_PENDING_FRAMES = 3;

/**
 * Get the timestamp writes for a render pass that the command encoder
 * records, or undefined when the frame is not timed.
 * @param {GPUCommandEncoder} commandEncoder
 * @param {string} label The name of the pass in the results
 */
export function getTimestampWrites(commandEncoder, label) {
  return encoderTimers.get(commandEncoder)?.getTimestampWrites(label);
}

// ----------------------------------------------------------------------------
// vtkWebGPUPassTimer methods
// ----------------------------------------------------------------------------

function vtkWebGPUPassTimer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPassTimer');

  function getBufferSize() {
    return model.maximumNumberOfPasses * BYTES_PER_PASS;
  }

  publicAPI.releaseGraphicsResources = () => {
    if (model.frameEncoder) {
      encoderTimers.delete(model.frameEncoder);
    }
    model.frameEncoder = null;
    model.pendingFrame = null;
    model.querySet?.destroy();
    model.querySet = null;
    model.resolveBuffer?.destroy();
    model.resolveBuffer = null;
    for (let i = 0; i < model.freeReadbackBuffers.length; i++) {
      model.freeReadbackBuffers[i].destroy();
    }
    model.freeReadbackBuffers = [];
    model.device = null;
  };

  publicAPI.isSupported = (device) => !!device?.hasFeature('timestamp-query');

  function createResources(device) {
    const handle = device.getHandle();
    model.querySet = handle.createQuerySet({
      label: 'passTimer',
      type: 'timestamp',
      count: 2 * model.maximumNumberOfPasses,
    });
    model.resolveBuffer = handle.createBuffer({
      label: 'passTimerResolve',
      size: getBufferSize(),
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      /* eslint-enable no-bitwise */
      /* eslint-enable no-undef */
    });
  }

  function getReadbackBuffer() {
    const buffer = model.freeReadbackBuffers.pop();
    if (buffer) {
      return buffer;
    }
    if (model.pendingReads >= MAXIMUM_PENDING_FRAMES) {
      return null;
    }
    return model.device.getHandle().createBuffer({
      label: 'passTimerReadback',
      size: getBufferSize(),
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      /* eslint-enable no-bitwise */
      /* eslint-enable no-undef */
    });
  }

  /**
   * Start to time the render passes that commandEncoder records. This does
   * nothing when the timer is disabled or the device does not have the
   * feature timestamp-query.
   */
  publicAPI.beginFrame = (device, commandEncoder) => {
    model.labels = [];
    if (!model.enabled || !publicAPI.isSupported(device)) {
      return;
    }
    if (model.device !== device) {
      publicAPI.releaseGraphicsResources();
      model.device = device;
    }
    if (!model.querySet) {
      createResources(device);
    }
    model.frameEncoder = commandEncoder;
    encoderTimers.set(commandEncoder, publicAPI);
  };

  publicAPI.getTimestampWrites = (label) => {
    if (model.labels.length >= model.maximumNumberOfPasses) {
      return undefined;
    }
    const index = 2 * model.labels.length;
    model.labels.push(label || 'unlabeled');
    return {
      querySet: model.querySet,
      beginningOfPassWriteIndex: index,
      endOfPassWriteIndex: index + 1,
    };
  };

  /**
   * Record the copy of the timestamps. Call this before the command encoder
   * is submitted.
   */
  publicAPI.endFrame = () => {
    const encoder = model.frameEncoder;
    model.frameEncoder = null;
    if (!encoder) {
      return;
    }
    encoderTimers.delete(encoder);
    const labels = model.labels;
    model.labels = [];
    if (!labels.length) {
      return;
    }
    const readbackBuffer = getReadbackBuffer();
    if (!readbackBuffer) {
      return;
    }
    const byteLength = labels.length * BYTES_PER_PASS;
    encoder.resolveQuerySet(
      model.querySet,
      0,
      2 * labels.length,
      model.resolveBuffer,
      0
    );
    encoder.copyBufferToBuffer(
      model.resolveBuffer,
      0,
      readbackBuffer,
      0,
      byteLength
    );
    model.pendingFrame = { labels, readbackBuffer, byteLength };
  };

  /**
   * Read the timestamps of the last frame. Call this after the command
   * encoder is submitted. The passTimes event gives the results when the
   * GPU has done the work.
   */
  publicAPI.readResults = () => {
    const frame = model.pendingFrame;
    model.pendingFrame = null;
    if (!frame) {
      return;
    }
    const device = model.device;
    model.pendingReads++;
    /* eslint-disable no-undef */
    frame.readbackBuffer
      .mapAsync(GPUMapMode.READ, 0, frame.byteLength)
      /* eslint-enable no-undef */
      .then(() => {
        const times = new BigUint64Array(
          frame.readbackBuffer.getMappedRange(0, frame.byteLength).slice(0)
        );
        frame.readbackBuffer.unmap();
        model.pendingReads--;
        if (model.device === device) {
          model.freeReadbackBuffers.push(frame.readbackBuffer);
        } else {
          frame.readbackBuffer.destroy();
        }

        const passes = [];
        let totalMs = 0;
        for (let i = 0; i < frame.labels.length; i++) {
          // A pass that the GPU did not time writes zeros.
          let ms = 0;
          if (times[2 * i + 1] > times[2 * i]) {
            ms = Number(times[2 * i + 1] - times[2 * i]) / 1e6;
          }
          passes.push({ label: frame.labels[i], ms });
          totalMs += ms;
        }
        model.lastPassTimes = { passes, totalMs };
        publicAPI.invokePassTimes(model.lastPassTimes);
      })
      .catch(() => {
        // The device was lost or destroyed before the results came back.
        model.pendingReads--;
        frame.readbackBuffer.destroy();
      });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enabled: false,
  maximumNumberOfPasses: 64,
  lastPassTimes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'passTimes');

  model.device = null;
  model.labels = [];
  model.frameEncoder = null;
  model.pendingFrame = null;
  model.pendingReads = 0;
  model.freeReadbackBuffers = [];
  model.querySet = null;
  model.resolveBuffer = null;

  macro.setGet(publicAPI, model, ['enabled']);
  macro.get(publicAPI, model, ['maximumNumberOfPasses', 'lastPassTimes']);

  vtkWebGPUPassTimer(publicAPI, model);

  publicAPI.delete = macro.chain(
    publicAPI.releaseGraphicsResources,
    publicAPI.delete
  );
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUPassTimer');

// ----------------------------------------------------------------------------

export default { newInstance, extend, getTimestampWrites };
