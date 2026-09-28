import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

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

  // The newest mtime of the bind group and of its bindables. A bindable
  // changes its bindGroupTime when its resource or its layout entry changes.
  function getBindablesMTime() {
    let mtime = publicAPI.getMTime();
    for (let i = 0; i < model.bindables.length; i++) {
      const tm = model.bindables[i].getBindGroupTime().getMTime();
      if (tm > mtime) {
        mtime = tm;
      }
    }
    return mtime;
  }

  // The layout is kept until the bindables change, because each draw asks
  // for it.
  publicAPI.getBindGroupLayout = (device) => {
    if (
      model.layout &&
      model.layoutDevice === device &&
      getBindablesMTime() < model.layoutTime.getMTime()
    ) {
      return model.layout;
    }
    const entries = [];
    for (let i = 0; i < model.bindables.length; i++) {
      model.bindables[i].setDevice?.(device);
      const entry = model.bindables[i].getBindGroupLayoutEntry();
      entry.binding = i;
      entries.push(entry);
    }
    model.layout = device.getBindGroupLayout({ entries });
    model.layoutDevice = device;
    model.layoutTime.modified();
    return model.layout;
  };

  publicAPI.getBindGroup = (device) => {
    const deviceChanged = model.bindGroupDevice !== device;

    for (let i = 0; i < model.bindables.length; i++) {
      model.bindables[i].setDevice?.(device);
    }

    // check mtime
    const mtime = getBindablesMTime();
    if (!deviceChanged && mtime < model.bindGroupTime.getMTime()) {
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
    model.bindGroupDevice = device;
    model.bindGroupTime.modified();

    return model.bindGroup;
  };

  publicAPI.getShaderCode = (pipeline) => {
    const lines = [];
    const bgroup = pipeline.getBindGroupLayoutIndex(model.label);
    if (bgroup < 0) {
      vtkErrorMacro(
        `vtkWebGPUBindGroup: bind group layout ${model.label} was not found in pipeline`
      );
      return '';
    }
    for (let i = 0; i < model.bindables.length; i++) {
      lines.push(model.bindables[i].getShaderCode(i, bgroup));
    }
    return lines.join('\n');
  };

  publicAPI.releaseGraphicsResources = () => {
    model.bindGroup = null;
    model.bindGroupDevice = null;
    model.layout = null;
    model.layoutDevice = null;
    model.bindGroupTime.modified();
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  handle: null,
  bindGroupDevice: null,
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

  model.layout = null;
  model.layoutDevice = null;
  model.layoutTime = {};
  macro.obj(model.layoutTime, { mtime: 0 });

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
