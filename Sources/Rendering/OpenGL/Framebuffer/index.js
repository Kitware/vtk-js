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

  function releaseOwnedColorBuffer() {
    if (model.ownedColorBuffer) {
      if (model._openGLRenderWindow && !model._openGLRenderWindow.isDeleted()) {
        model.ownedColorBuffer.releaseGraphicsResources(
          model._openGLRenderWindow
        );
      } else {
        // a shared GL context can outlive the render window
        model.context?.deleteTexture(model.ownedColorBuffer.getHandle());
      }
      model.ownedColorBuffer.delete();
      model.ownedColorBuffer = null;
    }
  }

  // Releases owned attachments; borrowed ones and the framebuffer stay alive.
  function releaseAttachments() {
    releaseOwnedColorBuffer();
    if (model.depthTexture) {
      model.context?.deleteRenderbuffer(model.depthTexture);
      model.depthTexture = null;
    }
    model.colorBuffers = [];
  }

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
    // noop on webgl
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
    // currently a noop
  };

  publicAPI.bind = (modeArg = null) => {
    let mode = modeArg;
    if (mode === null) {
      mode = model.context.FRAMEBUFFER;
    }
    model.context.bindFramebuffer(mode, model.glFramebuffer);
    // removed attachments leave empty slots; indices match attachment points
    model.colorBuffers.forEach((buffer) => buffer?.bind());
    model._openGLRenderWindow.setActiveFramebuffer(publicAPI);
  };

  publicAPI.create = (width, height) => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling create'
      );
      return;
    }

    const gl = model.context;
    const replaced = model.glFramebuffer;
    const wasBound =
      replaced && gl.getParameter(gl.FRAMEBUFFER_BINDING) === replaced;
    const wasSaved = replaced && model.previousDrawBinding === replaced;
    publicAPI.releaseGraphicsResources();
    model.glFramebuffer = gl.createFramebuffer();
    model.glFramebuffer.width = width;
    model.glFramebuffer.height = height;
    if (wasSaved) {
      // the saved binding named the framebuffer this call just deleted
      model.previousDrawBinding = model.glFramebuffer;
    }
    if (wasBound) {
      // deleting a bound framebuffer resets the GL binding to default
      publicAPI.bind();
    }
  };

  publicAPI.setColorBuffer = (texture, attachment = 0) => {
    const gl = model.context;

    if (!gl) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling setColorBuffer'
      );
      return;
    }

    if (
      model.colorBuffers[attachment] === model.ownedColorBuffer &&
      texture !== model.ownedColorBuffer
    ) {
      releaseOwnedColorBuffer();
    }

    let glAttachment = gl.COLOR_ATTACHMENT0;
    if (attachment > 0) {
      glAttachment += attachment;
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

    if (model.colorBuffers[attachment] === model.ownedColorBuffer) {
      releaseOwnedColorBuffer();
    }

    let glAttachment = gl.COLOR_ATTACHMENT0;
    if (attachment > 0) {
      glAttachment += attachment;
    }

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      glAttachment,
      gl.TEXTURE_2D,
      null,
      0
    );

    // clear without shifting: indices map to GL attachment points
    model.colorBuffers[attachment] = null;
    while (
      model.colorBuffers.length &&
      model.colorBuffers[model.colorBuffers.length - 1] == null
    ) {
      model.colorBuffers.pop();
    }
  };

  publicAPI.setDepthBuffer = (texture) => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling setDepthBuffer'
      );
      return;
    }

    const gl = model.context;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      texture.getHandle(),
      0
    );
  };

  publicAPI.removeDepthBuffer = () => {
    if (!model.context) {
      macro.vtkErrorMacro(
        'you must set the OpenGLRenderWindow before calling removeDepthBuffer'
      );
      return;
    }

    const gl = model.context;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      null,
      0
    );
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
    releaseAttachments();
    if (model.glFramebuffer) {
      model.context?.deleteFramebuffer(model.glFramebuffer);
      model.glFramebuffer = null;
    }
  };

  publicAPI.getSize = () => {
    if (model.glFramebuffer == null) return null;
    return [model.glFramebuffer.width, model.glFramebuffer.height];
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

    releaseAttachments();

    const texture = vtkOpenGLTexture.newInstance();
    texture.setOpenGLRenderWindow(model._openGLRenderWindow);
    texture.setMinificationFilter(Filter.LINEAR);
    texture.setMagnificationFilter(Filter.LINEAR);
    texture.create2DFromRaw({
      width: model.glFramebuffer.width,
      height: model.glFramebuffer.height,
      numComps: 4,
      dataType: VtkDataTypes.UNSIGNED_CHAR,
      data: null,
    });
    model.ownedColorBuffer = texture;
    publicAPI.setColorBuffer(texture);

    // use a renderbuffer for depth; no consumer samples this
    // framebuffer's depth as a texture
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

  publicAPI.delete = macro.chain(
    publicAPI.releaseGraphicsResources,
    publicAPI.delete
  );

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
  ownedColorBuffer: null,
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
