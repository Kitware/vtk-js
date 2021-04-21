import macro from 'vtk.js/Sources/macro';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';

// ----------------------------------------------------------------------------

function vtkWebGPUVolumePass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUVolumePass');

  publicAPI.traverse = (renNode, viewNode) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = viewNode;

    if (!model.renderEncoder) {
      publicAPI.createRenderEncoder();
    }
    model.renderEncoder.setColorTextureView(0, model.colorTextureView);

    model.renderEncoder.attachTextureViews();
    const renDesc = model.renderEncoder.getDescription();
    renDesc.colorAttachments[0].loadValue = 'load';
    publicAPI.setCurrentOperation('volumePass');
    renNode.setRenderEncoder(model.renderEncoder);
    renNode.traverse(publicAPI);
  };

  publicAPI.createRenderEncoder = () => {
    model.renderEncoder = vtkWebGPURenderEncoder.newInstance();
    const rDesc = model.renderEncoder.getDescription();
    delete rDesc.depthStencilAttachment;
    // rDesc.depthStencilAttachment = null;

    model.renderEncoder.setPipelineHash('volr');
    model.renderEncoder.setPipelineSettings({
      primitive: { cullMode: 'none' },
      fragment: {
        targets: [
          {
            format: 'bgra8unorm',
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
              },
              alpha: { srcfactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
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
  colorTextureView: null,
  depthTextureView: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['colorTextureView', 'depthTextureView']);

  // Object methods
  vtkWebGPUVolumePass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUVolumePass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
