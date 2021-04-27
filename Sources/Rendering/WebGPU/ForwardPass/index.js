import macro from 'vtk.js/Sources/macro';
import vtkWebGPURenderEncoder from 'vtk.js/Sources/Rendering/WebGPU/RenderEncoder';
import vtkWebGPUOrderIndepenentTranslucentPass from 'vtk.js/Sources/Rendering/WebGPU/OrderIndependentTranslucentPass';
import vtkWebGPUVolumePass from 'vtk.js/Sources/Rendering/WebGPU/VolumePass';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';

// ----------------------------------------------------------------------------

function vtkForwardPass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkForwardPass');

  // this pass implements a forward rendering pipeline
  // if both volumes and opaque geometry are present
  // it will mix the two together by capturing a zbuffer
  // first
  publicAPI.traverse = (viewNode, parent = null) => {
    if (model.deleted) {
      return;
    }

    // we just render our delegates in order
    model.currentParent = parent;

    // build
    publicAPI.setCurrentOperation('buildPass');
    viewNode.traverse(publicAPI);

    const numlayers = viewNode.getRenderable().getNumberOfLayers();

    if (!model.opaqueRenderEncoder) {
      publicAPI.createOpaqueRenderEncoder();
    }

    const swapChain = viewNode.getSwapChain();
    model.opaqueRenderEncoder.setColorTexture(0, swapChain.getCurrentTexture());
    model.opaqueRenderEncoder.setDepthTexture(swapChain.getDepthTexture());
    model.opaqueRenderEncoder.attachTextureViews();

    // iterate over renderers
    const renderers = viewNode.getChildren();
    for (let i = 0; i < numlayers; i++) {
      for (let index = 0; index < renderers.length; index++) {
        const renNode = renderers[index];
        const ren = viewNode.getRenderable().getRenderers()[index];

        if (ren.getDraw() && ren.getLayer() === i) {
          // check for both opaque and volume actors
          model.opaqueActorCount = 0;
          model.translucentActorCount = 0;
          model.volumeCount = 0;
          publicAPI.setCurrentOperation('queryPass');

          renNode.traverse(publicAPI);

          publicAPI.setCurrentOperation('cameraPass');
          renNode.traverse(publicAPI);

          // always do opaque pass to get a valid color and zbuffer, even if empty
          publicAPI.setCurrentOperation('opaquePass');
          renNode.setRenderEncoder(model.opaqueRenderEncoder);
          renNode.traverse(publicAPI);

          // optional translucent pass
          if (model.translucentActorCount > 0) {
            if (!model.translucentPass) {
              model.translucentPass = vtkWebGPUOrderIndepenentTranslucentPass.newInstance();
            }
            model.translucentPass.setColorTextureView(
              model.opaqueRenderEncoder.getColorTextureViews()[0]
            );
            model.translucentPass.setDepthTextureView(
              model.opaqueRenderEncoder.getDepthTextureView()
            );
            model.translucentPass.traverse(renNode, viewNode);
          }

          // optional volume pass
          if (model.volumeCount > 0) {
            if (!model.volumePass) {
              model.volumePass = vtkWebGPUVolumePass.newInstance();
            }
            model.volumePass.setColorTextureView(
              model.opaqueRenderEncoder.getColorTextureViews()[0]
            );
            model.volumePass.setDepthTextureView(
              model.opaqueRenderEncoder.getDepthTextureView()
            );
            model.volumePass.traverse(renNode, viewNode);
          }
        }
      }
    }
  };

  publicAPI.incrementOpaqueActorCount = () => model.opaqueActorCount++;
  publicAPI.incrementTranslucentActorCount = () =>
    model.translucentActorCount++;
  publicAPI.incrementVolumeCount = () => model.volumeCount++;

  publicAPI.createOpaqueRenderEncoder = () => {
    model.opaqueRenderEncoder = vtkWebGPURenderEncoder.newInstance();
    // default settings are fine for this
    model.opaqueRenderEncoder.setPipelineHash('op');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  opaqueActorCount: 0,
  translucentActorCount: 0,
  volumeCount: 0,
  opaqueRenderEncoder: null,
  translucentPass: null,
  volumePass: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['translucentPass', 'volumePass']);

  // Object methods
  vtkForwardPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkForwardPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
