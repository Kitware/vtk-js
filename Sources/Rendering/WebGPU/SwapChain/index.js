import * as macro from 'vtk.js/Sources/macro';
import vtkWebGPURenderPass from 'vtk.js/Sources/Rendering/WebGPU/RenderPass';
// import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

// ----------------------------------------------------------------------------
// vtkWebGPUSwapChain methods
// ----------------------------------------------------------------------------
function vtkWebGPUSwapChain(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUSwapChain');

  publicAPI.create = (device, window) => {
    model.device = device;
    if (window.getContext()) {
      const swapChainFormat = 'bgra8unorm';
      model.handle = window.getContext().configureSwapChain({
        device: device.getHandle(),
        format: swapChainFormat,
        //      usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
      });

      // todo: convert to a vtkWebGPUImage
      const depthFormat = 'depth24plus-stencil8';
      model.depthTexture = device.getHandle().createTexture({
        size: {
          width: window.getCanvas().width,
          height: window.getCanvas().height,
        },
        format: depthFormat,
        /* eslint-disable no-undef */
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      model.created = true;
    }
  };

  publicAPI.getRenderPassDescription = () => {
    const renDesc = {
      colorAttachments: [
        {
          attachment: undefined,
          loadValue: [0.3, 0.3, 0.3, 1],
        },
      ],
      depthStencilAttachment: {
        attachment: undefined,
        depthLoadValue: 1.0,
        depthStoreOp: 'store',
        stencilLoadValue: 0,
        stencilStoreOp: 'store',
      },
    };
    renDesc.colorAttachments[0].attachment = model.handle
      .getCurrentTexture()
      .createView();
    renDesc.depthStencilAttachment.attachment = model.depthTexture.createView();
    return renDesc;
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.created) {
      model.handle = null;
      model.created = false;
      model.depthTexture = null;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  device: null,
  created: false,
  handle: null,
  depthTexture: null,
  renderPass: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.renderPass = vtkWebGPURenderPass.newInstance();

  macro.setGet(publicAPI, model, ['created', 'device', 'handle', 'renderPass']);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkWebGPUSwapChain(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkWebGPUSwapChain');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
