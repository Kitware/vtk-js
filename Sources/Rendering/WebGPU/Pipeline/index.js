import * as macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWebGPUPipeline methods
// ----------------------------------------------------------------------------
function vtkWebGPUPipeline(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPipeline');

  publicAPI.getShaderDescriptions = () => model.shaderDescriptions;

  publicAPI.initialize = (device) => {
    // start with the renderencoder settings
    const pipelineDesc = model.renderEncoder.getPipelineSettings();

    pipelineDesc.primitive.topology = model.topology;

    pipelineDesc.vertex = model.vertexState;

    // add in bind group layouts
    const bindGroupLayouts = [];
    for (let i = 0; i < model.layouts.length; i++) {
      bindGroupLayouts.push(model.layouts[i].layout);
    }
    model.pipelineLayout = device
      .getHandle()
      .createPipelineLayout({ bindGroupLayouts });
    pipelineDesc.layout = model.pipelineLayout;

    for (let i = 0; i < model.shaderDescriptions.length; i++) {
      const sd = model.shaderDescriptions[i];
      const sm = device.getShaderModule(sd);
      if (sd.getType() === 'vertex') {
        pipelineDesc.vertex.module = sm.getHandle();
        pipelineDesc.vertex.entryPoint = 'main';
      }
      if (sd.getType() === 'fragment') {
        pipelineDesc.fragment.module = sm.getHandle();
        pipelineDesc.fragment.entryPoint = 'main';
      }
    }

    model.handle = device.getHandle().createRenderPipeline(pipelineDesc);
  };

  publicAPI.getShaderDescription = (stype) => {
    for (let i = 0; i < model.shaderDescriptions.length; i++) {
      if (model.shaderDescriptions[i].getType() === stype)
        return model.shaderDescriptions[i];
    }
    return null;
  };

  publicAPI.addBindGroupLayout = (bindGroup) => {
    if (!bindGroup) {
      return;
    }
    model.layouts.push({
      layout: bindGroup.getBindGroupLayout(model.device),
      name: bindGroup.getName(),
    });
  };

  publicAPI.getBindGroupLayoutCount = (lname) => {
    for (let i = 0; i < model.layouts.length; i++) {
      if (model.layouts[i].name === lname) {
        return i;
      }
    }
    return 0;
  };

  publicAPI.bindVertexInput = (renderEncoder, vInput) => {
    vInput.bindBuffers(renderEncoder);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  handle: null,
  layouts: null,
  renderEncoder: null,
  shaderDescriptions: null,
  vertexState: null,
  topology: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.layouts = [];
  model.shaderDescriptions = [];

  macro.get(publicAPI, model, ['handle']);
  macro.setGet(publicAPI, model, [
    'device',
    'renderEncoder',
    'topology',
    'vertexState',
  ]);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPUPipeline(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUPipeline');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
