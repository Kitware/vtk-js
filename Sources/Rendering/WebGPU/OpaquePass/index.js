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
    model._currentParent = viewNode;

    const device = viewNode.getDevice();
    const sampleCount = viewNode.getMultiSample ? viewNode.getMultiSample() : 1;

    // If sampleCount changed since last render, tear down and recreate
    if (model.renderEncoder && model._currentSampleCount !== sampleCount) {
      model.renderEncoder = null;
      model.colorTexture = null;
      model.depthTexture = null;
      model.resolveColorTexture = null;
      model._resolveColorTextureView = null;
    }

    if (!model.renderEncoder) {
      publicAPI.createRenderEncoder(sampleCount);
      model._currentSampleCount = sampleCount;

      const width = viewNode.getCanvas().width;
      const height = viewNode.getCanvas().height;

      // Color texture — multisampled when sampleCount > 1
      model.colorTexture = vtkWebGPUTexture.newInstance({
        label: 'opaquePassColor',
      });
      /* eslint-disable no-undef */
      /* eslint-disable no-bitwise */
      model.colorTexture.create(device, {
        width,
        height,
        format: 'rgba16float',
        sampleCount,
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT |
          (sampleCount === 1
            ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
            : 0),
      });
      const ctView = model.colorTexture.createView('opaquePassColorTexture');
      model.renderEncoder.setColorTextureView(0, ctView);

      // When MSAA is active, create a resolve target (1-sample) for
      // downstream passes that need to sample the color result
      if (sampleCount > 1) {
        model.resolveColorTexture = vtkWebGPUTexture.newInstance({
          label: 'opaquePassResolveColor',
        });
        model.resolveColorTexture.create(device, {
          width,
          height,
          format: 'rgba16float',
          usage:
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_SRC,
        });
        model._resolveColorTextureView = model.resolveColorTexture.createView(
          'opaquePassColorTexture'
        );
        const resolveView = model._resolveColorTextureView;
        model.renderEncoder.setResolveTextureView(0, resolveView);
      }

      // Depth texture — also multisampled
      model.depthFormat = 'depth32float';
      model.depthTexture = vtkWebGPUTexture.newInstance({
        label: 'opaquePassDepth',
      });
      model.depthTexture.create(device, {
        width,
        height,
        format: model.depthFormat,
        sampleCount,
        usage:
          GPUTextureUsage.RENDER_ATTACHMENT |
          (sampleCount === 1
            ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC
            : 0),
      });
      /* eslint-enable no-undef */
      /* eslint-enable no-bitwise */
      const dView = model.depthTexture.createView('opaquePassDepthTexture');
      model.renderEncoder.setDepthTextureView(dView);
    } else {
      const width = viewNode.getCanvas().width;
      const height = viewNode.getCanvas().height;
      model.colorTexture.resize(width, height);
      model.depthTexture.resize(width, height);
      if (model.resolveColorTexture) {
        model.resolveColorTexture.resize(width, height);
      }
    }

    model.renderEncoder.attachTextureViews();
    publicAPI.setCurrentOperation('opaquePass');
    renNode.setRenderEncoder(model.renderEncoder);
    renNode.traverse(publicAPI);
  };

  // When MSAA is active, downstream passes must sample from the resolved
  // (1-sample) texture, not the multisampled one
  publicAPI.getColorTextureView = () => {
    if (model._resolveColorTextureView) {
      return model._resolveColorTextureView;
    }
    return model.renderEncoder.getColorTextureViews()[0];
  };

  publicAPI.getDepthTextureView = () =>
    model.renderEncoder.getDepthTextureView();

  publicAPI.createRenderEncoder = (sampleCount = 1) => {
    model.renderEncoder = vtkWebGPURenderEncoder.newInstance({
      label: 'OpaquePass',
    });
    // default settings are fine for this
    model.renderEncoder.setPipelineHash('op');
    // Set multisample state in pipeline settings when MSAA is active
    if (sampleCount > 1) {
      const settings = model.renderEncoder.getPipelineSettings();
      settings.multisample = { count: sampleCount };
      model.renderEncoder.setPipelineSettings(settings);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  renderEncoder: null,
  colorTexture: null,
  depthTexture: null,
  resolveColorTexture: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'colorTexture',
    'depthTexture',
    'resolveColorTexture',
  ]);

  // Object methods
  vtkWebGPUOpaquePass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUOpaquePass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
