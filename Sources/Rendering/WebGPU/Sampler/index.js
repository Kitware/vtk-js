import macro from 'vtk.js/Sources/macros';

/* eslint-disable no-bitwise */

// ----------------------------------------------------------------------------
// vtkWebGPUSampler methods
// ----------------------------------------------------------------------------

function vtkWebGPUSampler(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSampler');

  publicAPI.create = (device, options = {}) => {
    model.device = device;
    model.options.addressModeU = options.addressModeU
      ? options.addressModeU
      : 'clamp-to-edge';
    model.options.addressModeV = options.addressModeV
      ? options.addressModeV
      : 'clamp-to-edge';
    model.options.addressModeW = options.addressModeW
      ? options.addressModeW
      : 'clamp-to-edge';
    model.options.magFilter = options.magFilter ? options.magFilter : 'nearest';
    model.options.minFilter = options.minFilter ? options.minFilter : 'nearest';
    model.options.mipmapFilter = options.mipmapFilter
      ? options.mipmapFilter
      : 'nearest';
    model.options.label = model.label;
    model.handle = model.device.getHandle().createSampler(model.options);
    model.bindGroupTime.modified();
  };

  publicAPI.getShaderCode = (binding, group) => {
    const result = `@binding(${binding}) @group(${group}) var ${model.label}: sampler;`;
    return result;
  };

  publicAPI.getBindGroupEntry = () => {
    const foo = {
      resource: model.handle,
    };
    return foo;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  handle: null,
  label: null,
  options: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  model.options = {};
  model.bindGroupLayoutEntry = {
    /* eslint-disable no-undef */
    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
    /* eslint-enable no-undef */
    sampler: {
      // type: 'filtering',
    },
  };

  model.bindGroupTime = {};
  macro.obj(model.bindGroupTime, { mtime: 0 });

  macro.get(publicAPI, model, ['bindGroupTime', 'handle', 'options']);
  macro.setGet(publicAPI, model, ['bindGroupLayoutEntry', 'device', 'label']);

  vtkWebGPUSampler(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
