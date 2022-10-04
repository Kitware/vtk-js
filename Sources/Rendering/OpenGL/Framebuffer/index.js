import * as macro from 'vtk.js/Sources/macros';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { Filter } from 'vtk.js/Sources/Rendering/OpenGL/Texture/Constants';

// ----------------------------------------------------------------------------
// vtkFramebuffer methods
// ----------------------------------------------------------------------------
function vtkFramebuffer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFramebuffer');

  publicAPI.getBothMode = () => model.context.FRAMEBUFFER;
  // publicAPI.getDrawMode = () => model.context.DRAW_FRAMEBUFFER;
  // publicAPI.getReadMode = () => model.context.READ_FRAMEBUFFER;

  publicAPI.saveCurrentBindingsAndBuffers = (modeIn) => {
    const mode =
      typeof modeIn !== 'undefined' ? modeIn : publicAPI.getBothMode();
    publicAPI.saveCurrentBindings(mode);
    publicAPI.saveCurrentBuffers(mode);
  };

  publicAPI.saveCurrentBindings = (modeIn) => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling saveCurrentBindings'
      );
      return;
    }

    const gl = model.context;
    model.previousDrawBinding = gl.getParameter(
      model.context.FRAMEBUFFER_BINDING
    );
    model.previousActiveFramebuffer =
      model._openGLRenderWindow.getActiveFramebuffer();
  };

  publicAPI.saveCurrentBuffers = (modeIn) => {
    // noop on webgl 1
  };

  publicAPI.restorePreviousBindingsAndBuffers = (modeIn) => {
    const mode =
      typeof modeIn !== 'undefined' ? modeIn : publicAPI.getBothMode();
    publicAPI.restorePreviousBindings(mode);
    publicAPI.restorePreviousBuffers(mode);
  };

  publicAPI.restorePreviousBindings = (modeIn) => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling restorePreviousBindings'
      );
      return;
    }

    const gl = model.context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, model.previousDrawBinding);
    model._openGLRenderWindow.setActiveFramebuffer(
      model.previousActiveFramebuffer
    );
  };

  publicAPI.restorePreviousBuffers = (modeIn) => {
    // currently a noop on webgl1
  };

  publicAPI.bind = (modeArg = null) => {
    let mode = modeArg;
    if (mode === null) {
      mode = model.context.FRAMEBUFFER;
    }
    model.context.bindFramebuffer(mode, model.glFramebuffer);
    for (let i = 0; i < model.colorBuffers.length; i++) {
      model.colorBuffers[i].bind();
    }
    model._openGLRenderWindow.setActiveFramebuffer(publicAPI);
  };

  publicAPI.create = (width, height) => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling create'
      );
      return;
    }

    model.glFramebuffer = model.context.createFramebuffer();
    model.glFramebuffer.width = width;
    model.glFramebuffer.height = height;
  };

  publicAPI.setColorBuffer = (texture, attachment = 0) => {
    const gl = model.context;

    if (!gl) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling setColorBuffer'
      );
      return;
    }

    let glAttachment = gl.COLOR_ATTACHMENT0;
    if (attachment > 0) {
      if (model._openGLRenderWindow.getWebgl2()) {
        glAttachment += attachment;
      } else {
        macro.vtkErrorMacro(
          'Using multiple framebuffer attachments requires WebGL 2'
        );
        return;
      }
    }
    model.colorBuffers[attachment] = texture;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      glAttachment,
      gl.TEXTURE_2D,
      texture.getHandle(),
      0
    );
  };

  publicAPI.removeColorBuffer = (attachment = 0) => {
    const gl = model.context;

    if (!gl) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling removeColorBuffer'
      );
      return;
    }

    let glAttachment = gl.COLOR_ATTACHMENT0;
    if (attachment > 0) {
      if (model._openGLRenderWindow.getWebgl2()) {
        glAttachment += attachment;
      } else {
        macro.vtkErrorMacro(
          'Using multiple framebuffer attachments requires WebGL 2'
        );
        return;
      }
    }

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      glAttachment,
      gl.TEXTURE_2D,
      null,
      0
    );

    model.colorBuffers = model.colorBuffers.splice(attachment, 1);
  };

  publicAPI.setDepthBuffer = (texture) => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling setDepthBuffer'
      );
      return;
    }

    if (model._openGLRenderWindow.getWebgl2()) {
      const gl = model.context;
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        texture.getHandle(),
        0
      );
    } else {
      macro.vtkErrorMacro(
        'Attaching depth buffer textures to fbo requires WebGL 2'
      );
    }
  };

  publicAPI.removeDepthBuffer = () => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling removeDepthBuffer'
      );
      return;
    }

    if (model._openGLRenderWindow.getWebgl2()) {
      const gl = model.context;
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        null,
        0
      );
    } else {
      macro.vtkErrorMacro(
        'Attaching depth buffer textures to framebuffers requires WebGL 2'
      );
    }
  };

  publicAPI.getGLFramebuffer = () => model.glFramebuffer;

  publicAPI.setOpenGLRenderWindow = (rw) => {
    if (model._openGLRenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model._openGLRenderWindow = rw;
    model.context = null;
    if (rw) {
      model.context = model._openGLRenderWindow.getContext();
    }
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.glFramebuffer) {
      model.context.deleteFramebuffer(model.glFramebuffer);
    }
  };

  publicAPI.getSize = () => {
    const size = [0, 0];
    if (model.glFramebuffer !== null) {
      size[0] = model.glFramebuffer.width;
      size[1] = model.glFramebuffer.height;
    }
    return size;
  };

  publicAPI.populateFramebuffer = () => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling populateFrameBuffer'
      );
      return;
    }

    publicAPI.bind();
    const gl = model.context;

    const texture = vtkOpenGLTexture.newInstance();
    texture.setOpenGLRenderWindow(model._openGLRenderWindow);
    texture.setMinificationFilter(Filter.LINEAR);
    texture.setMagnificationFilter(Filter.LINEAR);
    texture.create2DFromRaw(
      model.glFramebuffer.width,
      model.glFramebuffer.height,
      4,
      VtkDataTypes.UNSIGNED_CHAR,
      null
    );
    publicAPI.setColorBuffer(texture);

    // for now do not count on having a depth buffer texture
    // as they are not standard webgl 1
    model.depthTexture = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, model.depthTexture);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      model.glFramebuffer.width,
      model.glFramebuffer.height
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      model.depthTexture
    );
  };

  // For backwards compatibility. Use getColorBuffers()[0] going forward.
  publicAPI.getColorTexture = () => model.colorBuffers[0];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  // _openGLRenderWindow: null,
  glFramebuffer: null,
  colorBuffers: null,
  depthTexture: null,
  previousDrawBinding: 0,
  previousReadBinding: 0,
  previousDrawBuffer: 0,
  previousReadBuffer: 0,
  previousActiveFramebuffer: null,
};

// ----------------------------------------------------------------------------
export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  if (model.colorBuffers) {
    macro.vtkErrorMacro(
      'you cannot initialize colorBuffers through the constructor. You should call setColorBuffer() instead.'
    );
  }
  model.colorBuffers = [];
  macro.getArray(publicAPI, model, ['colorBuffers']);

  // For more macro methods, see "Sources/macros.js"
  // Object specific methods
  vtkFramebuffer(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkFramebuffer');

// ----------------------------------------------------------------------------
export default { newInstance, extend };
