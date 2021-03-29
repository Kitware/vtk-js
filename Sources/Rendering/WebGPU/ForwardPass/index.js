import macro from 'vtk.js/Sources/macro';
// import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
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
          if (model.opaqueActorCount > 0) {
            publicAPI.setCurrentOperation('opaquePass');
            renNode.traverse(publicAPI);
          }
          if (model.translucentActorCount > 0) {
            publicAPI.setCurrentOperation('translucentPass');
            renNode.traverse(publicAPI);
          }
          if (model.volumeCount > 0) {
            publicAPI.setCurrentOperation('volumePass');
            renNode.traverse(publicAPI);
          }
        }
      }
    }
  };

  publicAPI.getZBufferTexture = () => {
    if (model.framebuffer) {
      return model.framebuffer.getColorTexture();
    }
    return null;
  };

  publicAPI.incrementOpaqueActorCount = () => model.opaqueActorCount++;
  publicAPI.incrementTranslucentActorCount = () =>
    model.translucentActorCount++;
  publicAPI.incrementVolumeCount = () => model.volumeCount++;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  opaqueActorCount: 0,
  translucentActorCount: 0,
  volumeCount: 0,
  framebuffer: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['framebuffer']);

  // Object methods
  vtkForwardPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkForwardPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
