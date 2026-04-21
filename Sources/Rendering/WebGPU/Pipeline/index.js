import * as macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkWebGPUPipeline methods
// ----------------------------------------------------------------------------
function vtkWebGPUPipeline(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPipeline');

  publicAPI.getShaderDescriptions = () => model.shaderDescriptions;

  publicAPI.applyPipelineSettings = (baseSettings, extraSettings) => {
    if (!extraSettings) {
      return baseSettings;
    }

    const result = {
      ...baseSettings,
      ...extraSettings,
      primitive: {
        ...(baseSettings.primitive || {}),
        ...(extraSettings.primitive || {}),
      },
      depthStencil: {
        ...(baseSettings.depthStencil || {}),
        ...(extraSettings.depthStencil || {}),
      },
      fragment: {
        ...(baseSettings.fragment || {}),
        ...(extraSettings.fragment || {}),
      },
    };

    return result;
  };

  publicAPI.initialize = (device, hash) => {
    // start with the renderencoder settings
    model.pipelineDescription = publicAPI.applyPipelineSettings(
      model.renderEncoder.getPipelineSettings(),
      model.extraPipelineSettings
    );

    model.pipelineDescription.primitive.topology = model.topology;

    model.pipelineDescription.vertex = model.vertexState;

    model.pipelineDescription.label = hash;

    // add in bind group layouts
    const bindGroupLayouts = [];
    for (let i = 0; i < model.layouts.length; i++) {
      bindGroupLayouts.push(model.layouts[i].layout);
    }
    model.pipelineLayout = device
      .getHandle()
      .createPipelineLayout({ bindGroupLayouts });
    model.pipelineDescription.layout = model.pipelineLayout;

    for (let i = 0; i < model.shaderDescriptions.length; i++) {
      const sd = model.shaderDescriptions[i];
      const sm = device.getShaderModule(sd);
      if (sd.getType() === 'vertex') {
        model.pipelineDescription.vertex.module = sm.getHandle();
        model.pipelineDescription.vertex.entryPoint = 'main';
      }
      if (sd.getType() === 'fragment') {
        model.pipelineDescription.fragment.module = sm.getHandle();
        model.pipelineDescription.fragment.entryPoint = 'main';
      }
    }

    model.handle = device
      .getHandle()
      .createRenderPipeline(model.pipelineDescription);
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
      label: bindGroup.getLabel(),
    });
  };

  publicAPI.getBindGroupLayout = (idx) => model.layouts[idx].layout;

  publicAPI.getBindGroupLayoutIndex = (llabel) => {
    for (let i = 0; i < model.layouts.length; i++) {
      if (model.layouts[i].label === llabel) {
        return i;
      }
    }
    return -1; // Not found
  };

  publicAPI.bindVertexInput = (renderEncoder, vInput) => {
    vInput.bindBuffers(renderEncoder);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  extraPipelineSettings: null,
  handle: null,
  layouts: null,
  renderEncoder: null,
  shaderDescriptions: null,
  vertexState: null,
  topology: null,
  pipelineDescription: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.layouts = [];
  model.shaderDescriptions = [];

  macro.get(publicAPI, model, ['handle', 'pipelineDescription']);
  macro.setGet(publicAPI, model, [
    'device',
    'extraPipelineSettings',
    'renderEncoder',
    'topology',
    'vertexState',
  ]);

  // For more macro methods, see "Sources/macros.js"
  // Object specific methods
  vtkWebGPUPipeline(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUPipeline');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
