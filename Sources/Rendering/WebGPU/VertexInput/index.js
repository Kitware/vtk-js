import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (!b.includes(a[i])) return false;
  }
  return true;
}

// ----------------------------------------------------------------------------
// vtkWebGPUVertexInput methods
// ----------------------------------------------------------------------------
function vtkWebGPUVertexInput(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVertexInput');

  publicAPI.addBuffer = (buffer, inames, stepMode = 'vertex') => {
    let names = inames;
    if (!Array.isArray(names)) {
      names = [names];
    }
    // only add if it is a new setting
    for (let i = 0; i < model.inputs.length; i++) {
      if (arraysEqual(model.inputs[i].names, names)) {
        if (model.inputs[i].buffer === buffer) {
          return;
        }
        model.inputs[i].buffer = buffer;
        return;
      }
    }

    // when adding a new entry, make sure we sort the array
    // as the order is important to the shader and must always
    // be the same, so alphabetical is an easy option
    model.inputs.push({ buffer, stepMode, names });
    model.inputs = model.inputs.sort((v1, v2) => {
      if (v1.names[0] < v2.names[0]) {
        return -1;
      }
      if (v1.names[0] > v2.names[0]) {
        return 1;
      }
      return 0;
    });
  };

  publicAPI.removeBufferIfPresent = (name) => {
    for (let i = 0; i < model.inputs.length; i++) {
      if (model.inputs[i].names.includes(name)) {
        model.inputs.splice(i, 1);
      }
    }
  };

  publicAPI.getBuffer = (name) => {
    for (let i = 0; i < model.inputs.length; i++) {
      if (model.inputs[i].names.includes(name)) {
        return model.inputs[i].buffer;
      }
    }
    return null;
  };

  publicAPI.hasAttribute = (name) => {
    for (let i = 0; i < model.inputs.length; i++) {
      if (model.inputs[i].names.includes(name)) {
        return true;
      }
    }
    return false;
  };

  publicAPI.getAttributeTime = (name) => {
    for (let i = 0; i < model.inputs.length; i++) {
      if (model.inputs[i].names.includes(name)) {
        return model.inputs[i].buffer.getSourceTime();
      }
    }
    return 0;
  };

  publicAPI.getShaderCode = () => {
    let result = '';
    let nameCount = 0;
    for (let i = 0; i < model.inputs.length; i++) {
      for (let nm = 0; nm < model.inputs[i].names.length; nm++) {
        const arrayInfo = model.inputs[i].buffer.getArrayInformation()[nm];
        const type = vtkWebGPUTypes.getShaderTypeFromBufferFormat(
          arrayInfo.format
        );
        if (nameCount > 0) {
          result += ',\n';
        }
        result = `${result}  @location(${nameCount}) ${model.inputs[i].names[nm]} : ${type}`;
        nameCount++;
      }
    }
    return result;
  };

  publicAPI.getVertexInputInformation = () => {
    const info = {};
    if (model.inputs.length) {
      const vertexBuffers = [];
      let nameCount = 0;
      for (let i = 0; i < model.inputs.length; i++) {
        const buf = model.inputs[i].buffer;

        const buffer = {
          arrayStride: buf.getStrideInBytes(),
          stepMode: model.inputs[i].stepMode,
          attributes: [],
        };
        const arrayInfo = buf.getArrayInformation();
        for (let nm = 0; nm < model.inputs[i].names.length; nm++) {
          buffer.attributes.push({
            shaderLocation: nameCount,
            offset: arrayInfo[nm].offset,
            format: arrayInfo[nm].format,
          });
          nameCount++;
        }
        vertexBuffers.push(buffer);
      }
      info.buffers = vertexBuffers;
    }
    return info;
  };

  publicAPI.bindBuffers = (renderEncoder) => {
    for (let i = 0; i < model.inputs.length; i++) {
      renderEncoder.setVertexBuffer(i, model.inputs[i].buffer.getHandle());
    }
    if (model.indexBuffer) {
      renderEncoder.setIndexBuffer(
        model.indexBuffer.getHandle(),
        model.indexBuffer.getArrayInformation()[0].format
      );
    }
  };

  publicAPI.getReady = () => {};

  publicAPI.releaseGraphicsResources = () => {
    if (model.created) {
      model.inputs = [];
      model.bindingDescriptions = [];
      model.attributeDescriptions = [];
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  inputs: null,
  bindingDescriptions: false,
  attributeDescriptions: null,
  indexBuffer: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.bindingDescriptions = [];
  model.attributeDescriptions = [];
  model.inputs = [];

  macro.setGet(publicAPI, model, [
    'created',
    'device',
    'handle',
    'indexBuffer',
  ]);

  // For more macro methods, see "Sources/macros.js"
  // Object specific methods
  vtkWebGPUVertexInput(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUVertexInput');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
