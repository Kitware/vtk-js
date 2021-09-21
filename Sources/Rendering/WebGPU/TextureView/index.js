import macro from 'vtk.js/Sources/macros';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';

// ----------------------------------------------------------------------------
// vtkWebGPUTextureView methods
// ----------------------------------------------------------------------------

/* eslint-disable no-bitwise */

function vtkWebGPUTextureView(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureView');

  publicAPI.create = (texture, options) => {
    model.texture = texture;
    model.options = options;
    model.options.dimension = model.options.dimension || '2d';
    model.textureHandle = texture.getHandle();
    model.handle = model.textureHandle.createView(model.options);
    model.bindGroupLayoutEntry.texture.viewDimension = model.options.dimension;
    const tDetails = vtkWebGPUTypes.getDetailsFromTextureFormat(
      model.texture.getFormat()
    );
    model.bindGroupLayoutEntry.texture.sampleType = tDetails.sampleType;
  };

  publicAPI.getBindGroupEntry = () => {
    const foo = {
      resource: publicAPI.getHandle(),
    };
    return foo;
  };

  publicAPI.getShaderCode = (binding, group) => {
    let ttype = 'f32';
    if (model.bindGroupLayoutEntry.texture.sampleType === 'sint') {
      ttype = 'i32';
    } else if (model.bindGroupLayoutEntry.texture.sampleType === 'uint') {
      ttype = 'u32';
    }
    let result = `[[binding(${binding}), group(${group})]] var ${model.name}: texture_${model.options.dimension}<${ttype}>;`;
    if (model.bindGroupLayoutEntry.texture.sampleType === 'depth') {
      result = `[[binding(${binding}), group(${group})]] var ${model.name}: texture_depth_${model.options.dimension};`;
    }
    return result;
  };

  publicAPI.addSampler = (device, options) => {
    const newSamp = vtkWebGPUSampler.newInstance();
    newSamp.create(device, options);
    publicAPI.setSampler(newSamp);
    model.sampler.setName(`${model.name}Sampler`);
  };

  publicAPI.setName = (val) => {
    if (model.sampler) {
      model.sampler.setName(`${val}Sampler`);
    }
    if (model.name === val) {
      return;
    }
    model.name = val;
    publicAPI.modified();
  };

  publicAPI.getBindGroupTime = () => {
    // check if the handle changed
    if (model.texture.getHandle() !== model.textureHandle) {
      model.textureHandle = model.texture.getHandle();
      model.handle = model.textureHandle.createView(model.options);
      model.bindGroupTime.modified();
    }
    return model.bindGroupTime;
  };

  // if the texture has changed then get a new view
  publicAPI.getHandle = () => {
    if (model.texture.getHandle() !== model.textureHandle) {
      model.textureHandle = model.texture.getHandle();
      model.handle = model.textureHandle.createView(model.options);
      model.bindGroupTime.modified();
    }
    return model.handle;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  texture: null,
  handle: null,
  name: null,
  sampler: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  model.bindGroupLayoutEntry = {
    /* eslint-disable no-undef */
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    /* eslint-enable no-undef */
    texture: {
      sampleType: 'float',
      viewDimension: '2d',
      // multisampled: false,
    },
  };

  model.bindGroupTime = {};
  macro.obj(model.bindGroupTime, { mtime: 0 });

  macro.get(publicAPI, model, ['bindGroupTime', 'name', 'texture']);
  macro.setGet(publicAPI, model, ['bindGroupLayoutEntry', 'sampler']);

  vtkWebGPUTextureView(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
