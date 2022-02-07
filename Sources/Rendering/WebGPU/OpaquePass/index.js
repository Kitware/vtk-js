import macro from 'vtk.js/Sources/macros';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';

// ----------------------------------------------------------------------------

function vtkWebGPUOpaquePass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUOpaquePass');

  // this pass implements a forward rendering pipeline
  // if both volumes and opaque geometry are present
  // it will mix the two together by capturing a zbuffer
  // first
  publicAPI.traverse = (renNode, viewNode) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = viewNode;

    const device = viewNode.getDevice();

    if (!model.renderEncoder) {
      publicAPI.createRenderEncoder();
      model.colorTexture = vtkWebGPUTexture.newInstance({
        label: 'opaquePassColor',
      });
      model.colorTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'bgra8unorm',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT |
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_SRC,
      });
      const ctView = model.colorTexture.createView('opaquePassColorTexture');
      model.renderEncoder.setColorTextureView(0, ctView);

      model.depthFormat = 'depth32float';
      model.depthTexture = vtkWebGPUTexture.newInstance({
        label: 'opaquePassDepth',
      });
      model.depthTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: model.depthFormat,
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT |
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_SRC,
      });
      const dView = model.depthTexture.createView('opaquePassDepthTexture');
      model.renderEncoder.setDepthTextureView(dView);
    } else {
      model.colorTexture.resize(
        viewNode.getCanvas().width,
        viewNode.getCanvas().height
      );
      model.depthTexture.resize(
        viewNode.getCanvas().width,
        viewNode.getCanvas().height
      );
    }

    model.renderEncoder.attachTextureViews();
    publicAPI.setCurrentOperation('opaquePass');
    renNode.setRenderEncoder(model.renderEncoder);
    renNode.traverse(publicAPI);
  };

  publicAPI.getColorTextureView = () =>
    model.renderEncoder.getColorTextureViews()[0];

  publicAPI.getDepthTextureView = () =>
    model.renderEncoder.getDepthTextureView();

  publicAPI.createRenderEncoder = () => {
    model.renderEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'OpaquePass',
    });
    // default settings are fine for this
    model.renderEncoder.setPipelineHash('op');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  renderEncoder: null,
  colorTexture: null,
  depthTexture: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['colorTexture', 'depthTexture']);

  // Object methods
  vtkWebGPUOpaquePass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUOpaquePass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
