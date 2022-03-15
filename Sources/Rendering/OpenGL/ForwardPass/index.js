import macro from 'vtk.js/Sources/macros';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';
import vtkOpenGLOrderIndependentTranslucentPass from 'vtk.js/Sources/Rendering/OpenGL/OrderIndependentTranslucentPass';

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
          model.overlayActorCount = 0;
          publicAPI.setCurrentOperation('queryPass');

          renNode.traverse(publicAPI);

          // do we need to capture a zbuffer?
          if (
            (model.opaqueActorCount > 0 && model.volumeCount > 0) ||
            model.depthRequested
          ) {
            const size = viewNode.getFramebufferSize();
            // make sure the framebuffer is setup
            if (model.framebuffer === null) {
              model.framebuffer = vtkOpenGLFramebuffer.newInstance();
            }
            model.framebuffer.setOpenGLRenderWindow(viewNode);
            model.framebuffer.saveCurrentBindingsAndBuffers();
            const fbSize = model.framebuffer.getSize();
            if (
              fbSize === null ||
              fbSize[0] !== size[0] ||
              fbSize[1] !== size[1]
            ) {
              model.framebuffer.create(size[0], size[1]);
              model.framebuffer.populateFramebuffer();
            }
            model.framebuffer.bind();
            publicAPI.setCurrentOperation('opaqueZBufferPass');
            renNode.traverse(publicAPI);
            model.framebuffer.restorePreviousBindingsAndBuffers();

            // reset now that we have done it
            model.depthRequested = false;
          }

          publicAPI.setCurrentOperation('cameraPass');
          renNode.traverse(publicAPI);
          if (model.opaqueActorCount > 0) {
            publicAPI.setCurrentOperation('opaquePass');
            renNode.traverse(publicAPI);
          }
          if (model.translucentActorCount > 0) {
            if (!model.translucentPass) {
              model.translucentPass =
                vtkOpenGLOrderIndependentTranslucentPass.newInstance();
            }
            model.translucentPass.traverse(viewNode, renNode, publicAPI);
          }
          if (model.volumeCount > 0) {
            publicAPI.setCurrentOperation('volumePass');
            renNode.traverse(publicAPI);
          }
          if (model.overlayActorCount > 0) {
            publicAPI.setCurrentOperation('overlayPass');
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

  publicAPI.requestDepth = () => {
    model.depthRequested = true;
  };

  publicAPI.incrementOpaqueActorCount = () => model.opaqueActorCount++;
  publicAPI.incrementTranslucentActorCount = () =>
    model.translucentActorCount++;
  publicAPI.incrementVolumeCount = () => model.volumeCount++;
  publicAPI.incrementOverlayActorCount = () => model.overlayActorCount++;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  opaqueActorCount: 0,
  translucentActorCount: 0,
  volumeCount: 0,
  overlayActorCount: 0,
  framebuffer: null,
  depthRequested: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, [
    'framebuffer',
    'opaqueActorCount',
    'translucentActorCount',
    'volumeCount',
  ]);

  // Object methods
  vtkForwardPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkForwardPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
