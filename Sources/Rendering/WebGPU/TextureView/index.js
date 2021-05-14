import macro from 'vtk.js/Sources/macro';
import vtkWebGPUSampler from 'vtk.js/Sources/Rendering/WebGPU/Sampler';

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
    model.textureHandle = texture.getHandle();
    model.handle = model.textureHandle.createView(model.options);
  };

  publicAPI.getBindGroupLayout = (device) =>
    device.getBindGroupLayout(model.bindGroupDescription);

  publicAPI.getBindGroup = () => {
    // if we don't have a bind group or if our handle changed
    const handle = publicAPI.getHandle();
    if (!model.bindGroup || model.lastBindGroupHandle !== handle) {
      const device = model.texture.getDevice();
      const bgp = {
        layout: publicAPI.getBindGroupLayout(device),
        entries: [
          {
            binding: 0,
            resource: handle,
          },
        ],
      };
      if (model.sampler) {
        bgp.entries.push({
          binding: 1,
          resource: model.sampler.getHandle(),
        });
      }
      model.lastBindGroupHandle = handle;
      model.bindGroup = device.getHandle().createBindGroup(bgp);
    }
    return model.bindGroup;
  };

  publicAPI.getShaderCode = (pipeline) => {
    const bgroup = pipeline.getBindGroupLayoutCount(model.name);

    let result = `[[binding(0), group(${bgroup})]] var ${model.name}: texture_2d<f32>;`;
    if (model.sampler) {
      result += `[[binding(1), group(${bgroup})]] var ${model.name}Sampler: sampler;`;
    }
    return result;
  };

  publicAPI.addSampler = (device, options) => {
    const newSamp = vtkWebGPUSampler.newInstance();
    newSamp.create(device, options);
    publicAPI.setSampler(newSamp);
  };

  publicAPI.setSampler = (samp) => {
    if (model.sampler === samp) {
      return;
    }

    model.sampler = samp;

    if (model.sampler) {
      model.bindGroupDescription.entries.push({
        binding: 1,
        /* eslint-disable no-undef */
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        /* eslint-enable no-undef */
        sampler: {
          // type: 'filtering',
        },
      });
    }
  };

  // if the texture has changed then get a new view
  publicAPI.getHandle = () => {
    if (model.texture.getHandle() !== model.textureHandle) {
      model.textureHandle = model.texture.getHandle();
      model.handle = model.textureHandle.createView(model.options);
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

  model.bindGroupDescription = {
    entries: [
      {
        binding: 0,
        /* eslint-disable no-undef */
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        /* eslint-enable no-undef */
        texture: {
          // sampleType: 'float',
          // viewDimension: '2d',
          // multisampled: false,
        },
      },
    ],
  };

  macro.get(publicAPI, model, ['texture']);
  macro.setGet(publicAPI, model, ['name', 'sampler']);

  vtkWebGPUTextureView(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
