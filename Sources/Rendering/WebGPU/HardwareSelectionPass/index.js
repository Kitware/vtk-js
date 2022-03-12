import macro from 'vtk.js/Sources/macros';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUTexture from 'vtk.js/Sources/Rendering/WebGPU/Texture';
import vtkWebGPUShaderCache from 'vtk.js/Sources/Rendering/WebGPU/ShaderCache';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';

// ----------------------------------------------------------------------------

function vtkWebGPUHardwareSelectionPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUHardwareSelectionPass');

  // this pass implements a forward rendering pipeline
  // if both volumes and opaque geometry are present
  // it will mix the two together by capturing a zbuffer
  // first
  publicAPI.traverse = (viewNode, renNode) => {
    if (model.deleted) {
      return;
    }

    model.currentParent = null;

    // build
    publicAPI.setCurrentOperation('buildPass');
    viewNode.traverse(publicAPI);

    const device = viewNode.getDevice();

    if (!model.selectionRenderEncoder) {
      publicAPI.createRenderEncoder();

      // create color texture
      model.colorTexture = vtkWebGPUTexture.newInstance({
        label: 'hardwareSelectorColor',
      });
      model.colorTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'rgba32uint',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      const v1 = model.colorTexture.createView('hardwareSelectColorTexture');
      model.selectionRenderEncoder.setColorTextureView(0, v1);

      // create depth texture
      model.depthTexture = vtkWebGPUTexture.newInstance({
        label: 'hardwareSelectorDepth',
      });
      model.depthTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'depth32float',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      const v2 = model.depthTexture.createView('hardwareSelectDepthTexture');
      model.selectionRenderEncoder.setDepthTextureView(v2);
    } else {
      model.colorTexture.resize(
        viewNode.getCanvas().width,
        viewNode.getCanvas().height
      );
      model.depthTexture.resizeToMatch(model.colorTexture);
    }

    model.selectionRenderEncoder.attachTextureViews();
    renNode.setRenderEncoder(model.selectionRenderEncoder);

    publicAPI.setCurrentOperation('cameraPass');
    renNode.traverse(publicAPI);
    // opaque pass is used for selection
    publicAPI.setCurrentOperation('opaquePass');
    renNode.traverse(publicAPI);
  };

  publicAPI.createRenderEncoder = () => {
    model.selectionRenderEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'HardwareSelectionPass',
    });
    // default settings are fine for this
    model.selectionRenderEncoder.setPipelineHash('sel');
    model.selectionRenderEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<u32>', 'outColor');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        ['output.outColor = vec4<u32>(mapperUBO.PropID, compositeID, 0u, 0u);']
      ).result;
      fDesc.setCode(code);
    });
    const renDesc = model.selectionRenderEncoder.getDescription();
    renDesc.colorAttachments[0].clearValue = [0.0, 0.0, 0.0, 0.0];

    model.selectionRenderEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'greater',
        format: 'depth32float',
      },
      fragment: {
        targets: [
          {
            format: 'rgba32uint',
            blend: undefined,
          },
        ],
      },
    });
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  selectionRenderEncoder: null,
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
  vtkWebGPUHardwareSelectionPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUHardwareSelectionPass'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
