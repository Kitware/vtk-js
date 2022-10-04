import * as macro from 'vtk.js/Sources/macros';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkWebGPUTextureManager from 'vtk.js/Sources/Rendering/WebGPU/TextureManager';

/**
 * provide a simple WeakRefMap class to share device objects based on
 * hash values so that buffers/textures etc can be shared betwen mappers.
 * This is roughly based on WeakLRUCache but without the actual caching
 * behavior. This is just a map of key -> WeakRef(value)
 */

/* eslint-disable no-undef */
export class WeakRefMap extends Map {
  constructor() {
    super();
    this.registry = new FinalizationRegistry((key) => {
      const entry = super.get(key);
      if (entry && entry.deref && entry.deref() === undefined)
        super.delete(key);
    });
  }

  getValue(key) {
    const entry = super.get(key);
    if (entry) {
      const value = entry.deref();
      if (value !== undefined) return value;
      super.delete(key);
    }
    return undefined;
  }

  setValue(key, value) {
    let entry;
    if (value && typeof value === 'object') {
      entry = new WeakRef(value);
      this.registry.register(value, key);
      super.set(key, entry);
    }
    // else entry is undefined
    return entry;
  }
}
/* eslint-enable no-undef */

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
    pipeline.initialize(publicAPI, hash);
    model.pipelines[hash] = pipeline;
  };

  publicAPI.onSubmittedWorkDone = () =>
    model.handle.queue.onSubmittedWorkDone();

  // The Device has an object cache that can be used to cache buffers,
  // textures and other objects that can be shared. The basic approach is to
  // call getCachedObject with a request and a create function. The request
  // is based on a hash. The cache lookup just returns any entry that has a
  // matching hash. If a match isn't found then the create function is
  // called with any extra arguments.

  // is the object already cached?
  publicAPI.hasCachedObject = (hash) => model.objectCache.getValue(hash);

  publicAPI.getCachedObject = (hash, creator, ...args) => {
    if (!hash) {
      vtkErrorMacro('attempt to cache an object without a hash');
      return null;
    }

    const existingValue = model.objectCache.getValue(hash);
    if (existingValue) {
      return existingValue;
    }

    const createdObject = creator(...args);
    model.objectCache.setValue(hash, createdObject);
    return createdObject;
  };
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

  // this is a weak ref cache implementation, we create it without
  // an expirer (so it is strictly based on garbage collection and
  // objects are not held if there are no external references)
  // model.objectCache = new WeakLRUCache({ expirer: false });
  model.objectCache = new WeakRefMap();

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
