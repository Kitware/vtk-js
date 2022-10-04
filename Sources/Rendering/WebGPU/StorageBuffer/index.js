import macro from 'vtk.js/Sources/macros';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

const { BufferUsage } = vtkWebGPUBufferManager;

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWebGPUStorageBuffer - similar to the UniformBuffer class
// but YOU are responsible for layout issues and alignment.
// The order you add entries is the order they will be layed out
// in memory. But you must follow layout rules.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkWebGPUStorageBuffer methods
// ----------------------------------------------------------------------------

function vtkWebGPUStorageBuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUStorageBuffer');

  publicAPI.addEntry = (name, type) => {
    if (model._bufferEntryNames.has(name)) {
      vtkErrorMacro(`entry named ${name} already exists`);
      return;
    }
    model._bufferEntryNames.set(name, model.bufferEntries.length);
    const sizeInBytes = vtkWebGPUTypes.getByteStrideFromShaderFormat(type);
    model.bufferEntries.push({
      name,
      type,
      sizeInBytes,
      offset: model.sizeInBytes,
      nativeType: vtkWebGPUTypes.getNativeTypeFromShaderFormat(type),
    });
    model.sizeInBytes += sizeInBytes;
  };

  publicAPI.send = (device) => {
    if (!model._buffer) {
      const req = {
        nativeArray: model.Float32Array,
        usage: BufferUsage.Storage,
        label: model.label,
      };
      model._buffer = device.getBufferManager().getBuffer(req);
      model.bindGroupTime.modified();
      model._sendTime.modified();
      return;
    }

    device
      .getHandle()
      .queue.writeBuffer(
        model._buffer.getHandle(),
        0,
        model.arrayBuffer,
        0,
        model.sizeInBytes * model.numberOfInstances
      );
    model._sendTime.modified();
  };

  publicAPI.createView = (type) => {
    if (type in model === false) {
      if (!model.arrayBuffer) {
        model.arrayBuffer = new ArrayBuffer(
          model.sizeInBytes * model.numberOfInstances
        );
      }
      model[type] = macro.newTypedArray(type, model.arrayBuffer);
    }
  };

  publicAPI.setValue = (name, instance, val) => {
    const idx = model._bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    view[
      (entry.offset + instance * model.sizeInBytes) / view.BYTES_PER_ELEMENT
    ] = val;
  };

  publicAPI.setArray = (name, instance, arr) => {
    const idx = model._bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    const ioffset =
      (entry.offset + instance * model.sizeInBytes) / view.BYTES_PER_ELEMENT;
    for (let i = 0; i < arr.length; i++) {
      view[ioffset + i] = arr[i];
    }
  };

  publicAPI.setAllInstancesFromArray = (name, arr) => {
    const idx = model._bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    const numComponents = arr.length / model.numberOfInstances;
    for (let inst = 0; inst < model.numberOfInstances; inst++) {
      const ioffset =
        (entry.offset + inst * model.sizeInBytes) / view.BYTES_PER_ELEMENT;
      for (let i = 0; i < numComponents; i++) {
        view[ioffset + i] = arr[inst * numComponents + i];
      }
    }
  };

  publicAPI.setAllInstancesFromArrayColorToFloat = (name, arr) => {
    const idx = model._bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    const numComponents = arr.length / model.numberOfInstances;
    for (let inst = 0; inst < model.numberOfInstances; inst++) {
      const ioffset =
        (entry.offset + inst * model.sizeInBytes) / view.BYTES_PER_ELEMENT;
      for (let i = 0; i < numComponents; i++) {
        view[ioffset + i] = arr[inst * numComponents + i] / 255.0;
      }
    }
  };

  publicAPI.setAllInstancesFromArray3x3To4x4 = (name, arr) => {
    const idx = model._bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    const numComponents = 9;
    for (let inst = 0; inst < model.numberOfInstances; inst++) {
      const ioffset =
        (entry.offset + inst * model.sizeInBytes) / view.BYTES_PER_ELEMENT;
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
          view[ioffset + j * 4 + i] = arr[inst * numComponents + j * 3 + i];
        }
      }
    }
  };

  publicAPI.getSendTime = () => model._sendTime.getMTime();
  publicAPI.getShaderCode = (binding, group) => {
    const lines = [`struct ${model.label}StructEntry\n{`];
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      lines.push(`  ${entry.name}: ${entry.type},`);
    }
    lines.push(`
};
struct ${model.label}Struct
{
  values: array<${model.label}StructEntry>,
};
@binding(${binding}) @group(${group}) var<storage, read> ${model.label}: ${model.label}Struct;
`);

    return lines.join('\n');
  };

  publicAPI.getBindGroupEntry = () => {
    const foo = {
      resource: {
        buffer: model._buffer.getHandle(),
      },
    };
    return foo;
  };

  publicAPI.clearData = () => {
    model.numberOfInstances = 0;
    model.sizeInBytes = 0;
    model.bufferEntries = [];
    model._bufferEntryNames = new Map();
    model._buffer = null;
    delete model.arrayBuffer;
    delete model.Float32Array;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bufferEntries: null,
  bufferEntryNames: null,
  sizeInBytes: 0,
  label: null,
  numberOfInstances: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Internal objects
  model._bufferEntryNames = new Map();
  model.bufferEntries = [];

  model._sendTime = {};
  macro.obj(model._sendTime, { mtime: 0 });

  model.bindGroupTime = {};
  macro.obj(model.bindGroupTime, { mtime: 0 });

  // default SSBO desc
  model.bindGroupLayoutEntry = model.bindGroupLayoutEntry || {
    buffer: {
      type: 'read-only-storage',
    },
  };

  macro.get(publicAPI, model, ['bindGroupTime']);
  macro.setGet(publicAPI, model, [
    'device',
    'bindGroupLayoutEntry',
    'label',
    'numberOfInstances',
    'sizeInBytes',
  ]);

  // Object methods
  vtkWebGPUStorageBuffer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUStorageBuffer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
