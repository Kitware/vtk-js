import macro from 'vtk.js/Sources/macro';
import vtkRenderPass from 'vtk.js/Sources/Rendering/SceneGraph/RenderPass';

// ----------------------------------------------------------------------------
//
// To use this class do something like
//
// const remotePass = vtkRemotePass.newInstance();
// remotePass.setDelegates([vtkForwardPass.newInstance()]);
// fullScreenRenderer.getOpenGLRenderWindow().setRenderPasses([remotePass]);
//
function vtkRemotePass(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRemotePass');

  // this pass implements a remote rendering pipeline
  // where the actual rendering takes place remotely
  // with camera values sent to the remote and images
  // returned.
  publicAPI.traverse = (viewNode, parent = null) => {
    if (model.deleted) {
      return;
    }

    // if local rendering instead then pass to delegate
    if (model.useLocalRendering) {
      model.delegates.forEach((val) => {
        val.traverse(viewNode, publicAPI);
      });
      return;
    }

    // might have to handle selection in a special way
    // as the hardware selector uses rendering...

    // we just render our delegates in order
    model.currentParent = parent;

    // build pass even with remote rendering just to make sure
    // everything is created.
    publicAPI.setCurrentOperation('buildPass');
    viewNode.traverse(publicAPI);

    // send information to the remote ala
    // send viewNode.getFramebufferSize();

    // iterate over renderers
    const renderers = viewNode.getChildren();
    // send renderers.length
    for (let index = 0; index < renderers.length; index++) {
      const renNode = renderers[index];
      // send renNode.getRenderable().getBackground() etc
      const camera = renNode.getRenderable().getActiveCamera();
      // send camera.get... etc
    }

    // paste the remote image, note that viewNode here
    // is the OpenGLRenderWindow and has a getCanvas()
    // method
    // viewNode.getCanvas()...
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  useLocalRendering: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkRenderPass.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['useLocalRendering']);

  // Object methods
  vtkRemotePass(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRemotePass');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
