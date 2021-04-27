import macro from 'vtk.js/Sources/macro';
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
      model.colorTexture = vtkWebGPUTexture.newInstance();
      model.colorTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'rgba32uint',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      model.selectionRenderEncoder.setColorTexture(0, model.colorTexture);

      // create depth texture
      model.depthTexture = vtkWebGPUTexture.newInstance();
      model.depthTexture.create(device, {
        width: viewNode.getCanvas().width,
        height: viewNode.getCanvas().height,
        format: 'depth32float',
        /* eslint-disable no-undef */
        /* eslint-disable no-bitwise */
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      });
      model.selectionRenderEncoder.setDepthTexture(model.depthTexture);
    } else {
      model.colorTexture.resize(
        viewNode.getCanvas().width,
        viewNode.getCanvas().height
      );
      model.depthTexture.resizeToMatch(model.colorTexture);
    }

    model.selectionRenderEncoder.attachTextureViews();
    const renDesc = model.selectionRenderEncoder.getDescription();
    renDesc.colorAttachments[0].loadValue = [0.0, 0.0, 0.0, 0.0];
    renNode.setRenderEncoder(model.selectionRenderEncoder);
    renNode.traverse(publicAPI);

    // check for both opaque and volume actors
    publicAPI.setCurrentOperation('cameraPass');
    renNode.traverse(publicAPI);
    // always do opaque pass to get a valid color and zbuffer, even if empty
    publicAPI.setCurrentOperation('opaquePass');
    renNode.setRenderEncoder(model.selectionRenderEncoder);
    renNode.traverse(publicAPI);
  };

  publicAPI.createRenderEncoder = () => {
    model.selectionRenderEncoder = vtkWebGPURenderEncoder.newInstance();
    // default settings are fine for this
    model.selectionRenderEncoder.setPipelineHash('sel');
    model.selectionRenderEncoder.setReplaceShaderCodeFunction((pipeline) => {
      const fDesc = pipeline.getShaderDescription('fragment');
      fDesc.addOutput('vec4<u32>', 'outColor');
      let code = fDesc.getCode();
      code = vtkWebGPUShaderCache.substitute(
        code,
        '//VTK::RenderEncoder::Impl',
        [
          'output.outColor = vec4<u32>(mapperUBO.PropID,0u,0u,mapperUBO.PropID);',
        ]
      ).result;
      fDesc.setCode(code);
    });
    model.selectionRenderEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
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
