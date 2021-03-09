import * as macro from 'vtk.js/Sources/macro';
import vtkWebGPUBufferManager from 'vtk.js/Sources/Rendering/WebGPU/BufferManager';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';

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
  publicAPI.getRendererBindGroupLayout = () => {
    if (!model.rendererBindGroupLayout) {
      const descriptor = {
        entries: [
          {
            binding: 0,
            /* eslint-disable no-undef */
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            /* eslint-enable no-undef */
            buffer: {
              type: 'uniform',
              hasDynamicOffset: false,
              minBindingSize: 0,
            },
          },
        ],
      };
      model.rendererBindGroupLayout = model.handle.createBindGroupLayout(
        descriptor
      );
    }
    return model.rendererBindGroupLayout;
  };

  publicAPI.getMapperBindGroupLayout = () => {
    if (!model.mapperBindGroupLayout) {
      const descriptor = {
        entries: [
          {
            binding: 0,
            /* eslint-disable no-undef */
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            /* eslint-enable no-undef */
            buffer: {
              type: 'uniform',
              hasDynamicOffset: false,
              minBindingSize: 0,
            },
          },
        ],
      };
      model.mapperBindGroupLayout = model.handle.createBindGroupLayout(
        descriptor
      );
    }
    return model.mapperBindGroupLayout;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  handle: null,
  shaderCache: null,
  rendererBindGroupLayout: null,
  mapperBindGroupLayout: null,
  bufferManager: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['handle']);
  macro.get(publicAPI, model, ['bufferManager', 'shaderCache']);

  model.shaderCache = vtkWebGPUShaderCache.newInstance();
  model.shaderCache.setDevice(publicAPI);

  model.bufferManager = vtkWebGPUBufferManager.newInstance();
  model.bufferManager.setDevice(publicAPI);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPUDevice(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUDevice');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
