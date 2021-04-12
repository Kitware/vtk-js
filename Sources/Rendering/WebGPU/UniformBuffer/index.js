import macro from 'vtk.js/Sources/macro';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

const { BufferUsage } = vtkWebGPUBufferManager;

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkWebGPUUniformBuffer methods
// ----------------------------------------------------------------------------

function vtkWebGPUUniformBuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUUniformBuffer');

  publicAPI.addEntry = (name, type) => {
    if (model.bufferEntryNames.has(name)) {
      vtkErrorMacro(`entry named ${name} already exists`);
      return;
    }
    model.sortDirty = true;
    model.bufferEntryNames.set(name, model.bufferEntries.length);
    model.bufferEntries.push({
      name,
      type,
      sizeInBytes: vtkWebGPUTypes.getByteStrideFromShaderFormat(type),
      offset: -1,
      nativeType: vtkWebGPUTypes.getNativeTypeFromShaderFormat(type),
      packed: false,
    });
  };

  // UBOs have layout rules in terms of how memory is aligned so we
  // have to be careful how we order the entries. For example a vec4<f32>
  // must be aligned on a 16 byte offset, etc. See
  // https://gpuweb.github.io/gpuweb/wgsl/#memory-layouts
  // for more details.
  publicAPI.sortBufferEntries = () => {
    if (!model.sortDirty) {
      return;
    }

    let currOffset = 0;
    const newEntries = [];

    // pack anything whose size is a multiple of 16 bytes first
    // this includes a couple types that don't require 16 byte alignment
    // such as mat2x2<f32> but that is OK
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      if (entry.packed === false && entry.sizeInBytes % 16 === 0) {
        entry.packed = true;
        entry.offset = currOffset;
        newEntries.push(entry);
        currOffset += entry.sizeInBytes;
      }
    }

    // now it gets tough, we have the following common types (f32, i32, u32)
    // - vec2<f32> 8 byte size, 8 byte alignment
    // - vec3<f32> 12 byte size, 16 byte alignment
    // - f32 4 byte size, 4 byte alignment

    // try adding 12 byte, 4 byte pairs
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      if (entry.packed === false && entry.sizeInBytes === 12) {
        for (let i2 = 0; i2 < model.bufferEntries.length; i2++) {
          const entry2 = model.bufferEntries[i2];
          if (entry2.packed === false && entry2.sizeInBytes === 4) {
            entry.packed = true;
            entry.offset = currOffset;
            newEntries.push(entry);
            currOffset += entry.sizeInBytes;
            entry2.packed = true;
            entry2.offset = currOffset;
            newEntries.push(entry2);
            currOffset += entry2.sizeInBytes;
            break;
          }
        }
      }
    }

    // try adding 8 byte, 8 byte pairs
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      if (!entry.packed && entry.sizeInBytes % 8 === 0) {
        for (let i2 = i + 1; i2 < model.bufferEntries.length; i2++) {
          const entry2 = model.bufferEntries[i2];
          if (!entry2.packed && entry2.sizeInBytes % 8 === 0) {
            entry.packed = true;
            entry.offset = currOffset;
            newEntries.push(entry);
            currOffset += entry.sizeInBytes;
            entry2.packed = true;
            entry2.offset = currOffset;
            newEntries.push(entry2);
            currOffset += entry2.sizeInBytes;
            break;
          }
        }
      }
    }

    // try adding 8 byte, 4 byte 4 byte triplets
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      if (!entry.packed && entry.sizeInBytes % 8 === 0) {
        let found = false;
        for (let i2 = 0; !found && i2 < model.bufferEntries.length; i2++) {
          const entry2 = model.bufferEntries[i2];
          if (!entry2.packed && entry2.sizeInBytes === 4) {
            for (let i3 = i2 + 1; i3 < model.bufferEntries.length; i3++) {
              const entry3 = model.bufferEntries[i3];
              if (!entry3.packed && entry3.sizeInBytes === 4) {
                entry.packed = true;
                entry.offset = currOffset;
                newEntries.push(entry);
                currOffset += entry.sizeInBytes;
                entry2.packed = true;
                entry2.offset = currOffset;
                newEntries.push(entry2);
                currOffset += entry2.sizeInBytes;
                entry3.packed = true;
                entry3.offset = currOffset;
                newEntries.push(entry3);
                currOffset += entry3.sizeInBytes;
                found = true;
                break;
              }
            }
          }
        }
      }
    }

    // Add anything remaining that is larger than 4 bytes and hope we get lucky.
    // Likely if there is more than one item added here it will result
    // in a failed UBO
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      if (!entry.packed && entry.sizeInBytes > 4) {
        entry.packed = true;
        entry.offset = currOffset;
        newEntries.push(entry);
        currOffset += entry.sizeInBytes;
      }
    }

    // finally add remaining 4 byte items
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      if (!entry.packed) {
        entry.packed = true;
        entry.offset = currOffset;
        newEntries.push(entry);
        currOffset += entry.sizeInBytes;
      }
    }

    // update entries and entryNames
    model.bufferEntries = newEntries;
    model.bufferEntryNames.clear();
    for (let i = 0; i < model.bufferEntries.length; i++) {
      model.bufferEntryNames.set(model.bufferEntries[i].name, i);
    }
    model.sizeInBytes = currOffset;
    model.sortDirty = false;
  };

  publicAPI.sendIfNeeded = (device, layout) => {
    if (!model.UBO) {
      const req = {
        address: model.Float32Array,
        time: 0,
        usage: BufferUsage.UniformArray,
      };
      model.UBO = device.getBufferManager().getBuffer(req);
      model.bindGroup = device.getHandle().createBindGroup({
        layout,
        entries: [
          {
            binding: model.binding,
            resource: {
              buffer: model.UBO.getHandle(),
            },
          },
        ],
      });
      model.sendTime.modified();
      model.sendDirty = false;
    }

    // send data down if needed
    if (model.sendDirty) {
      device
        .getHandle()
        .queue.writeBuffer(
          model.UBO.getHandle(),
          0,
          model.arrayBuffer,
          0,
          model.sizeInBytes
        );
      model.sendTime.modified();
      model.sendDirty = false;
    }
  };

  publicAPI.createView = (type) => {
    if (type in model === false) {
      if (!model.arrayBuffer) {
        model.arrayBuffer = new ArrayBuffer(model.sizeInBytes);
      }
      model[type] = new window[type](model.arrayBuffer);
    }
  };

  publicAPI.setValue = (name, val) => {
    publicAPI.sortBufferEntries();
    const idx = model.bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    if (view[entry.offset / view.BYTES_PER_ELEMENT] !== val) {
      view[entry.offset / view.BYTES_PER_ELEMENT] = val;
      model.sendDirty = true;
    }
  };

  publicAPI.setArray = (name, arr) => {
    publicAPI.sortBufferEntries();
    const idx = model.bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const view = model[entry.nativeType];
    for (let i = 0; i < arr.length; i++) {
      if (view[entry.offset / view.BYTES_PER_ELEMENT + i] !== arr[i]) {
        view[entry.offset / view.BYTES_PER_ELEMENT + i] = arr[i];
        model.sendDirty = true;
      }
    }
  };

  publicAPI.getNativeView = (name) => {
    publicAPI.sortBufferEntries();
    const idx = model.bufferEntryNames.get(name);
    if (idx === undefined) {
      vtkErrorMacro(`entry named ${name} not found in UBO`);
      return undefined;
    }
    const entry = model.bufferEntries[idx];
    publicAPI.createView(entry.nativeType);
    const bpe = model[entry.nativeType].BYTES_PER_ELEMENT;
    model.sendDirty = true;
    return new window[entry.nativeType](
      model.arrayBuffer,
      entry.offset,
      entry.sizeInBytes / bpe
    );
  };

  publicAPI.getSendTime = () => model.sendTime.getMTime();
  publicAPI.getShaderCode = () => {
    // sort the entries
    publicAPI.sortBufferEntries();

    let result = `[[block]] struct ${model.name}Struct\n{\n`;
    for (let i = 0; i < model.bufferEntries.length; i++) {
      const entry = model.bufferEntries[i];
      result += `[[offset(${entry.offset})]] ${entry.name}: ${entry.type};\n`;
    }
    result += `};\n[[binding(${model.binding}), group(${model.group})]] var<uniform> ${model.name}: ${model.name}Struct;`;
    return result;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bufferEntries: null,
  bufferEntryNames: null,
  sizeInBytes: 0,
  name: null,
  binding: 0,
  group: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  // Internal objects
  model.bufferEntryNames = new Map();
  model.bufferEntries = [];

  model.sendTime = {};
  macro.obj(model.sendTime, { mtime: 0 });

  model.sendDirty = true;
  model.sortDirty = true;

  macro.get(publicAPI, model, ['bindGroup']);
  macro.setGet(publicAPI, model, [
    'binding',
    'device',
    'group',
    'name',
    'sizeInBytes',
  ]);

  // Object methods
  vtkWebGPUUniformBuffer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUUniformBuffer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
