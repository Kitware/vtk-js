import macro from 'vtk.js/Sources/macros';
import vtkWebGPUOpaquePass from 'vtk.js/Sources/Rendering/WebGPU/OpaquePass';
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

    if (!model.opaquePass) {
      model.opaquePass = vtkWebGPUOpaquePass.newInstance();
    }

    const numlayers = viewNode.getRenderable().getNumberOfLayers();

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
          model.volumes = [];
          publicAPI.setCurrentOperation('queryPass');

          renNode.traverse(publicAPI);

          publicAPI.setCurrentOperation('cameraPass');
          renNode.traverse(publicAPI);

          // always do opaque pass to get a valid color and zbuffer, even if empty
          model.opaquePass.traverse(renNode, viewNode);

          // optional translucent pass
          if (model.translucentActorCount > 0) {
            if (!model.translucentPass) {
              model.translucentPass =
                vtkWebGPUOrderIndepenentTranslucentPass.newInstance();
            }
            model.translucentPass.setColorTextureView(
              model.opaquePass.getColorTextureView()
            );
            model.translucentPass.setDepthTextureView(
              model.opaquePass.getDepthTextureView()
            );
            model.translucentPass.traverse(renNode, viewNode);
          }

          // optional volume pass
          if (model.volumes.length > 0) {
            if (!model.volumePass) {
              model.volumePass = vtkWebGPUVolumePass.newInstance();
            }
            model.volumePass.setColorTextureView(
              model.opaquePass.getColorTextureView()
            );
            model.volumePass.setDepthTextureView(
              model.opaquePass.getDepthTextureView()
            );
            model.volumePass.setVolumes(model.volumes);
            model.volumePass.traverse(renNode, viewNode);
          }
        }
      }
    }

    // blit the result into the swap chain
    const sctex = viewNode.getCurrentTexture();
    const optex = model.opaquePass.getColorTexture();
    const cmdEnc = viewNode.getCommandEncoder();
    cmdEnc.copyTextureToTexture(
      {
        texture: optex.getHandle(),
      },
      {
        texture: sctex,
      },
      {
        width: optex.getWidth(),
        height: optex.getHeight(),
        depthOrArrayLayers: 1,
      }
    );
  };

  publicAPI.incrementOpaqueActorCount = () => model.opaqueActorCount++;
  publicAPI.incrementTranslucentActorCount = () =>
    model.translucentActorCount++;
  publicAPI.addVolume = (volume) => {
    model.volumes.push(volume);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  opaqueActorCount: 0,
  translucentActorCount: 0,
  volumes: null,
  opaqueRenderEncoder: null,
  translucentPass: null,
  volumePass: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'opaquePass',
    'translucentPass',
    'volumePass',
  ]);

  // Object methods
  vtkForwardPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkForwardPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
