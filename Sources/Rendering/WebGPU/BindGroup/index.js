import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkWebGPUBindGroup methods
// ----------------------------------------------------------------------------

function vtkWebGPUBindGroup(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUBindGroup');

  publicAPI.setBindables = (bindables) => {
    // is there a difference between the old and new list?
    if (model.bindables.length === bindables.length) {
      let allMatch = true;
      for (let i = 0; i < model.bindables.length; i++) {
        if (model.bindables[i] !== bindables[i]) {
          allMatch = false;
        }
      }
      if (allMatch) {
        return;
      }
    }

    // there is a difference
    model.bindables = bindables;
    publicAPI.modified();
  };

  publicAPI.getBindGroupLayout = (device) => {
    const entries = [];
    for (let i = 0; i < model.bindables.length; i++) {
      const entry = model.bindables[i].getBindGroupLayoutEntry();
      entry.binding = i;
      entries.push(entry);
    }
    return device.getBindGroupLayout({ entries });
  };

  publicAPI.getBindGroup = (device) => {
    // check mtime
    let mtime = publicAPI.getMTime();
    for (let i = 0; i < model.bindables.length; i++) {
      const tm = model.bindables[i].getBindGroupTime().getMTime();
      mtime = tm > mtime ? tm : mtime;
    }
    if (mtime < model.bindGroupTime.getMTime()) {
      return model.bindGroup;
    }

    const entries = [];
    for (let i = 0; i < model.bindables.length; i++) {
      const entry = model.bindables[i].getBindGroupEntry();
      entry.binding = i;
      entries.push(entry);
    }

    model.bindGroup = device.getHandle().createBindGroup({
      layout: publicAPI.getBindGroupLayout(device),
      entries,
      label: model.label,
    });
    model.bindGroupTime.modified();

    return model.bindGroup;
  };

  publicAPI.getShaderCode = (pipeline) => {
    const lines = [];
    const bgroup = pipeline.getBindGroupLayoutCount(model.label);
    for (let i = 0; i < model.bindables.length; i++) {
      lines.push(model.bindables[i].getShaderCode(i, bgroup));
    }
    return lines.join('\n');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  handle: null,
  label: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  model.bindables = [];

  model.bindGroupTime = {};
  macro.obj(model.bindGroupTime, { mtime: 0 });

  macro.get(publicAPI, model, [
    'bindGroupTime',
    'handle',
    'sizeInBytes',
    'usage',
  ]);
  macro.setGet(publicAPI, model, ['label', 'device', 'arrayInformation']);

  vtkWebGPUBindGroup(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
