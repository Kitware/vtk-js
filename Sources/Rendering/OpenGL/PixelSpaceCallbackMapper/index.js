// import { mat4, vec3 }     from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

const { vtkDebugMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLPixelSpaceCallbackMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLPixelSpaceCallbackMapper(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLPixelSpaceCallbackMapper');

  publicAPI.opaquePass = (prepass, renderPass) => {
    model.openGLRenderer =
      publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
    model._openGLRenderWindow = model.openGLRenderer.getParent();
    const aspectRatio = model.openGLRenderer.getAspectRatio();
    const camera = model.openGLRenderer
      ? model.openGLRenderer.getRenderable().getActiveCamera()
      : null;
    const tsize = model.openGLRenderer.getTiledSizeAndOrigin();
    let texels = null;

    if (model.renderable.getUseZValues()) {
      const zbt = renderPass.getZBufferTexture();
      const width = Math.floor(zbt.getWidth());
      const height = Math.floor(zbt.getHeight());

      const gl = model._openGLRenderWindow.getContext();
      zbt.bind();

      // Here we need to use vtkFramebuffer to save current settings (bindings/buffers)
      const fb = renderPass.getFramebuffer();
      if (!fb) {
        vtkDebugMacro('No framebuffer to save/restore');
      } else {
        // save framebuffer settings
        fb.saveCurrentBindingsAndBuffers();
      }

      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        zbt.getHandle(),
        0
      );

      if (
        gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
      ) {
        texels = new Uint8Array(width * height * 4);
        gl.viewport(0, 0, width, height);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, texels);
      }

      // Now we need to restore framebuffer bindings/buffers
      if (fb) {
        fb.restorePreviousBindingsAndBuffers();
      }

      gl.deleteFramebuffer(framebuffer);
    }

    model.renderable.invokeCallback(
      model.renderable.getInputData(),
      camera,
      aspectRatio,
      tsize,
      texels
    );
  };

  publicAPI.queryPass = (prepass, renderPass) => {
    if (prepass) {
      if (model.renderable.getUseZValues()) {
        renderPass.requestDepth();
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  // Object methods
  vtkOpenGLPixelSpaceCallbackMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLPixelSpaceCallbackMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkPixelSpaceCallbackMapper', newInstance);
