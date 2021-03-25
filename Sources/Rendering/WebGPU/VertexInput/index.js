import * as macro from 'vtk.js/Sources/macro';
// import vtkWebGPURenderPass from 'vtk.js/Sources/Rendering/WebGPU/RenderPass';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (!b.includes(a[i])) return false;
  }
  return true;
}

function getTypeFromFormat(buffer, index) {
  const arrayInfo = buffer.getArrayInformation()[index];
  const format = arrayInfo.format;
  const dataType = 'f32';
  if (format.substring(format.length - 2) === 'x4') return `vec4<${dataType}>`;
  if (format.substring(format.length - 2) === 'x3') return `vec3<${dataType}>`;
  if (format.substring(format.length - 2) === 'x2') return `vec2<${dataType}>`;
  return dataType;
}

// ----------------------------------------------------------------------------
// vtkWebGPUVertexInput methods
// ----------------------------------------------------------------------------
function vtkWebGPUVertexInput(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVertexInput');

  publicAPI.addBuffer = (buffer, inames) => {
    let names = inames;
    if (!Array.isArray(names)) {
      names = [names];
    }
    // only add if it is a new setting
    for (let i = 0; i < model.inputs.length; i++) {
      if (arraysEqual(model.inputs[i].names, names)) {
        if (model.inputs[i].buffer === buffer) return;
        model.inputs.splice(i, 1);
      }
    }

    model.inputs.push({ buffer, names });
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
        const type = getTypeFromFormat(model.inputs[i].buffer, nm);
        result = `${result}[[location(${nameCount})]] var<in> ${model.inputs[i].names[nm]} : ${type};\n`;
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

        const buffer = { arrayStride: buf.getStrideInBytes(), attributes: [] };
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

  publicAPI.bindBuffers = (renderPass) => {
    for (let i = 0; i < model.inputs.length; i++) {
      renderPass.setVertexBuffer(i, model.inputs[i].buffer.getHandle());
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
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.bindingDescriptions = [];
  model.attributeDescriptions = [];
  model.inputs = [];

  macro.setGet(publicAPI, model, ['created', 'device', 'handle', 'renderPass']);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPUVertexInput(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUVertexInput');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
