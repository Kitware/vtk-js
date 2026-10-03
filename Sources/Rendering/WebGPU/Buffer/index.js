import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebGPU/BufferManager/Constants';

// methods we forward to the handle
const forwarded = ['getMappedRange', 'mapAsync', 'unmap'];

// A buffer that is mapped at creation, and a buffer copy, need a size that is
// a multiple of 4 bytes.
function alignTo4(byteCount) {
  return Math.ceil(byteCount / 4) * 4;
}

// The bytes of a typed array or a DataView. The view can start at an offset
// in a larger ArrayBuffer.
function getBytes(data) {
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return new Uint8Array(data);
}

function bufferSubData(device, destBuffer, destOffset, srcBytes) {
  const byteCount = alignTo4(srcBytes.byteLength);
  const srcBuffer = device.createBuffer({
    size: byteCount,
    /* eslint-disable no-undef */
    usage: GPUBufferUsage.COPY_SRC,
    /* eslint-enable no-undef */
    mappedAtCreation: true,
  });
  const arrayBuffer = srcBuffer.getMappedRange(0, byteCount);
  new Uint8Array(arrayBuffer).set(srcBytes); // memcpy
  srcBuffer.unmap();

  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(srcBuffer, 0, destBuffer, destOffset, byteCount);
  const commandBuffer = encoder.finish();
  const queue = device.queue;
  queue.submit([commandBuffer]);

  srcBuffer.destroy();
}
// ----------------------------------------------------------------------------
// vtkWebGPUBufferManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUBuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUBuffer');

  publicAPI.create = (sizeInBytes, usage) => {
    // The allocation has room for a write of sizeInBytes, which copies a
    // size that is a multiple of 4.
    model.handle = model.device.getHandle().createBuffer({
      size: alignTo4(sizeInBytes),
      usage,
      label: model.label,
    });
    model.sizeInBytes = sizeInBytes;
    model.usage = usage;
  };

  publicAPI.write = (data) => {
    bufferSubData(model.device.getHandle(), model.handle, 0, getBytes(data));
  };

  publicAPI.createAndWrite = (data, usage) => {
    const paddedSize = alignTo4(data.byteLength);
    model.handle = model.device.getHandle().createBuffer({
      size: paddedSize,
      usage,
      mappedAtCreation: true,
      label: model.label,
    });
    model.sizeInBytes = paddedSize;
    model.usage = usage;
    new Uint8Array(model.handle.getMappedRange()).set(getBytes(data)); // memcpy
    model.handle.unmap();
  };

  // simple forwarders
  for (let i = 0; i < forwarded.length; i++) {
    publicAPI[forwarded[i]] = (...args) => model.handle[forwarded[i]](...args);
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  handle: null,
  sizeInBytes: 0,
  strideInBytes: 0,
  arrayInformation: null,
  usage: null,
  label: null,
  sourceTime: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['handle', 'sizeInBytes', 'usage']);
  macro.setGet(publicAPI, model, [
    'strideInBytes',
    'device',
    'arrayInformation',
    'label',
    'sourceTime',
  ]);

  vtkWebGPUBuffer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
