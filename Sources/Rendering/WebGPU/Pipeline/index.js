import * as macro from 'vtk.js/Sources/macro';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

// ----------------------------------------------------------------------------
// vtkWebGPUPipeline methods
// ----------------------------------------------------------------------------
function vtkWebGPUPipeline(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUPipeline');

  publicAPI.getShaderDescriptions = () => model.shaderDescriptions;

  publicAPI.initialize = (window) => {
    const device = window.getDevice();

    const pipelineDesc = {
      primitiveTopology: model.topology,
      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus-stencil8',
      },
      rasterizationState: {
        cullMode: 'none',
      },

      colorStates: [
        {
          format: 'bgra8unorm',
        },
      ],
    };

    pipelineDesc.vertexState = model.vertexState;

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
        pipelineDesc.vertexStage = {
          module: sm.getHandle(),
          entryPoint: 'main',
        };
      }
      if (sd.getType() === 'fragment') {
        pipelineDesc.fragmentStage = {
          module: sm.getHandle(),
          entryPoint: 'main',
        };
      }
    }

    // console.log(JSON.stringify(pipelineDesc));
    model.handle = device.getHandle().createRenderPipeline(pipelineDesc);
  };

  publicAPI.getShaderDescription = (stype) => {
    for (let i = 0; i < model.shaderDescriptions.length; i++) {
      if (model.shaderDescriptions[i].getType() === stype)
        return model.shaderDescriptions[i];
    }
    return null;
  };

  publicAPI.addBindGroupLayout = (layout, lname) => {
    model.layouts.push({ layout, name: lname });
  };

  publicAPI.getBindGroupLayoutCount = (lname) => {
    for (let i = 0; i < model.layouts.length; i++) {
      if (model.layouts[i].name === lname) {
        return i;
      }
    }
    return 0;
  };

  publicAPI.bind = (renderPass) => {
    renderPass.setPipeline(model.handle);
  };

  publicAPI.bindVertexInput = (renderPass, vInput) => {
    vInput.bindBuffers(renderPass);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  handle: null,
  layouts: null,
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

  macro.setGet(publicAPI, model, ['device', 'topology', 'vertexState']);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPUPipeline(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUPipeline');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
