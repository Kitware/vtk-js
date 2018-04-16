import macro from 'vtk.js/Sources/macro';
import vtkOpenGLFramebuffer from 'vtk.js/Sources/Rendering/OpenGL/Framebuffer';
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

    // iterate over renderers
    const renderers = viewNode.getChildren();
    for (let index = 0; index < renderers.length; index++) {
      const renNode = renderers[index];

      // check for both opaque and volume actors
      model.opaqueActorCount = 0;
      model.translucentActorCount = 0;
      model.volumeCount = 0;
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
        if (fbSize === null || fbSize[0] !== size[0] || fbSize[1] !== size[1]) {
          model.framebuffer.create(size[0], size[1]);
          model.framebuffer.populateFramebuffer();
        }
        model.framebuffer.bind();
        publicAPI.setCurrentOperation('opaqueZBufferPass');
        renNode.traverse(publicAPI);
        model.framebuffer.restorePreviousBindingsAndBuffers();
      }

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
  depthRequested: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['framebuffer']);
  macro.setGet(publicAPI, model, ['depthRequested']);

  // Object methods
  vtkForwardPass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkForwardPass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
