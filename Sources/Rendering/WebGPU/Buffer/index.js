import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/WebGPU/BufferManager/Constants';

// methods we forward to the handle
const forwarded = ['getMappedRange', 'mapAsync', 'unmap'];

function bufferSubData(device, destBuffer, destOffset, srcArrayBuffer) {
  const byteCount = srcArrayBuffer.byteLength;
  const srcBuffer = device.createBuffer({
    size: byteCount,
    /* eslint-disable no-undef */
    usage: GPUBufferUsage.COPY_SRC,
    /* eslint-enable no-undef */
    mappedAtCreation: true,
  });
  const arrayBuffer = srcBuffer.getMappedRange(0, byteCount);
  new Uint8Array(arrayBuffer).set(new Uint8Array(srcArrayBuffer)); // memcpy
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
    model.handle = model.device.getHandle().createBuffer({
      size: sizeInBytes,
      usage,
      label: model.label,
    });
    model.sizeInBytes = sizeInBytes;
    model.usage = usage;
  };

  publicAPI.write = (data) => {
    bufferSubData(model.device.getHandle(), model.handle, 0, data.buffer);
  };

  publicAPI.createAndWrite = (data, usage) => {
    model.handle = model.device.getHandle().createBuffer({
      size: data.byteLength,
      usage,
      mappedAtCreation: true,
      label: model.label,
    });
    model.sizeInBytes = data.byteLength;
    model.usage = usage;
    new Uint8Array(model.handle.getMappedRange()).set(
      new Uint8Array(data.buffer)
    ); // memcpy
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
