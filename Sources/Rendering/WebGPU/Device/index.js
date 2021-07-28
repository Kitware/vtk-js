import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTextureManager from 'vtk.js/Sources/Rendering/WebGPU/TextureManager';

// ----------------------------------------------------------------------------
// vtkWebGPUDevice methods
// ----------------------------------------------------------------------------
function vtkWebGPUDevice(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUDevice');
  publicAPI.initialize = (handle) => {
    model.handle = handle;
  };

  publicAPI.createCommandEncoder = () => model.handle.createCommandEncoder();

  publicAPI.submitCommandEncoder = (commandEncoder) => {
    model.handle.queue.submit([commandEncoder.finish()]);
  };

  publicAPI.getShaderModule = (sd) => model.shaderCache.getShaderModule(sd);

  /* eslint-disable no-bitwise */
  /* eslint-disable no-undef */
  publicAPI.getBindGroupLayout = (val) => {
    if (!val.entries) {
      return null;
    }

    // add in basic required values if missing
    for (let i = 0; i < val.entries.length; i++) {
      const ent = val.entries[i];
      ent.binding = ent.binding || 0;
      ent.visibility =
        ent.visibility || GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    }

    // do we already have one?
    const sval = JSON.stringify(val);
    for (let i = 0; i < model.bindGroupLayouts.length; i++) {
      if (model.bindGroupLayouts[i].sval === sval) {
        return model.bindGroupLayouts[i].layout;
      }
    }

    // create one and store it
    const layout = model.handle.createBindGroupLayout(val);

    // we actually only store the stringified version
    // as that is what we always compare against
    model.bindGroupLayouts.push({ sval, layout });
    return layout;
  };

  publicAPI.getBindGroupLayoutDescription = (layout) => {
    for (let i = 0; i < model.bindGroupLayouts.length; i++) {
      if (model.bindGroupLayouts[i].layout === layout) {
        return model.bindGroupLayouts[i].sval;
      }
    }
    vtkErrorMacro('layout not found');
    console.trace();
    return null;
  };

  publicAPI.getPipeline = (hash) => {
    if (hash in model.pipelines) {
      return model.pipelines[hash];
    }
    return null;
  };

  publicAPI.createPipeline = (hash, pipeline) => {
    pipeline.initialize(publicAPI);
    model.pipelines[hash] = pipeline;
  };

  publicAPI.onSubmittedWorkDone = () =>
    model.handle.queue.onSubmittedWorkDone();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  handle: null,
  pipelines: null,
  shaderCache: null,
  bindGroupLayouts: null,
  bufferManager: null,
  textureManager: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['handle']);
  macro.get(publicAPI, model, [
    'bufferManager',
    'shaderCache',
    'textureManager',
  ]);

  model.shaderCache = vtkWebGPUShaderCache.newInstance();
  model.shaderCache.setDevice(publicAPI);

  model.bindGroupLayouts = [];

  model.bufferManager = vtkWebGPUBufferManager.newInstance();
  model.bufferManager.setDevice(publicAPI);

  model.textureManager = vtkWebGPUTextureManager.newInstance();
  model.textureManager.setDevice(publicAPI);

  model.pipelines = {};

  // For more macro methods, see "Sources/macros.js"
  // Object specific methods
  vtkWebGPUDevice(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUDevice');

// ----------------------------------------------------------------------------
export default {
  newInstance,
  extend,
};
