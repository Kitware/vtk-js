import * as macro from 'vtk.js/Sources/macro';
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
    const gl = model.context;
    model.previousDrawBinding = gl.getParameter(
      model.context.FRAMEBUFFER_BINDING
    );
    model.previousActiveFramebuffer = model.openGLRenderWindow.getActiveFramebuffer();
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
    const gl = model.context;
    gl.bindFramebuffer(gl.FRAMEBUFFER, model.previousDrawBinding);
    model.openGLRenderWindow.setActiveFramebuffer(
      model.previousActiveFramebuffer
    );
  };

  publicAPI.restorePreviousBuffers = (modeIn) => {
    // currently a noop on webgl1
  };

  publicAPI.bind = () => {
    model.context.bindFramebuffer(
      model.context.FRAMEBUFFER,
      model.glFramebuffer
    );
    if (model.colorTexture) {
      model.colorTexture.bind();
    }
    model.openGLRenderWindow.setActiveFramebuffer(publicAPI);
  };

  publicAPI.create = (width, height) => {
    model.glFramebuffer = model.context.createFramebuffer();
    model.glFramebuffer.width = width;
    model.glFramebuffer.height = height;
  };

  publicAPI.setColorBuffer = (texture, mode) => {
    const gl = model.context;
    model.colorTexture = texture;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture.getHandle(),
      0
    );
  };

  // publicAPI.setDepthBuffer = (texture, mode) => {
  //   const gl = model.context;
  //   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture.getHandle(), 0);
  // };

  publicAPI.getGLFramebuffer = () => model.glFramebuffer;

  publicAPI.setOpenGLRenderWindow = (rw) => {
    if (model.openGLRenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model.openGLRenderWindow = rw;
    model.context = null;
    if (rw) {
      model.context = model.openGLRenderWindow.getContext();
    }
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.glFramebuffer) {
      model.context.deleteFramebuffer(model.glFramebuffer);
    }
    if (model.depthTexture) {
      model.depthTexture.releaseGraphicsResources();
    }
    if (model.colorTexture) {
      model.colorTexture.releaseGraphicsResources();
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
    publicAPI.bind();
    const gl = model.context;

    const texture = vtkOpenGLTexture.newInstance();
    texture.setOpenGLRenderWindow(model.openGLRenderWindow);
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

    // for now do not count of having a depth buffer texture
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  openGLRenderWindow: null,
  glFramebuffer: null,
  colorTexture: null,
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

  macro.setGet(publicAPI, model, ['colorTexture']);

  // For more macro methods, see "Sources/macro.js"
  // Object specific methods
  vtkFramebuffer(publicAPI, model);
}

// ----------------------------------------------------------------------------
export const newInstance = macro.newInstance(extend, 'vtkFramebuffer');

// ----------------------------------------------------------------------------
export default Object.assign({ newInstance, extend });
