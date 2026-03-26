import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSharedRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/SharedRenderWindow';
import { GET_UNDERLYING_CONTEXT } from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow/ContextProxy';

function createDirtyHostResources(gl) {
  return {
    arrayBuffer: gl.createBuffer(),
    elementArrayBuffer: gl.createBuffer(),
    renderbuffer: gl.createRenderbuffer(),
    texture: gl.createTexture(),
  };
}

function deleteDirtyHostResources(gl, resources) {
  gl.deleteBuffer(resources.arrayBuffer);
  gl.deleteBuffer(resources.elementArrayBuffer);
  gl.deleteRenderbuffer(resources.renderbuffer);
  gl.deleteTexture(resources.texture);
}

function dirtyHostGLState(gl, resources) {
  gl.enable(gl.BLEND);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);
  gl.depthMask(false);
  gl.colorMask(true, false, true, false);
  gl.clearColor(1, 0, 0, 1);
  gl.scissor(20, 30, 80, 90);
  gl.viewport(20, 30, 120, 130);

  gl.bindBuffer(gl.ARRAY_BUFFER, resources.arrayBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, resources.elementArrayBuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, resources.renderbuffer);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, resources.texture);

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
}

function createHostFramebuffer(gl, width, height) {
  const framebuffer = gl.createFramebuffer();
  const colorTexture = gl.createTexture();
  const depthRenderbuffer = gl.createRenderbuffer();

  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTexture,
    0
  );

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    depthRenderbuffer
  );

  return { framebuffer, colorTexture, depthRenderbuffer };
}

function deleteHostFramebuffer(gl, fbo) {
  gl.deleteFramebuffer(fbo.framebuffer);
  gl.deleteTexture(fbo.colorTexture);
  gl.deleteRenderbuffer(fbo.depthRenderbuffer);
}

function createSharedWindow(gc, t) {
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.2, 0.3, 0.4);

  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);
  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);
  const cone = gc.registerResource(vtkConeSource.newInstance());
  mapper.setInputConnection(cone.getOutputPort());

  const glWindow = gc.registerResource(renderWindow.newAPISpecificView());
  glWindow.setContainer(renderWindowContainer);
  renderWindow.addView(glWindow);
  glWindow.setSize(400, 400);

  const glProxy = glWindow.get3DContext();
  const gl = glProxy?.[GET_UNDERLYING_CONTEXT]?.();
  t.ok(gl, 'WebGL context created');

  const sharedWindow = gc.registerResource(
    vtkSharedRenderWindow.createFromContext(glWindow.getCanvas(), gl)
  );
  sharedWindow.setAutoClear(true);
  sharedWindow.setSize(400, 400);
  renderWindow.removeView(glWindow);
  renderWindow.addView(sharedWindow);
  renderer.resetCamera();

  return { gl, sharedWindow };
}

test.onlyIfWebGL(
  'Test renderShared resets vtk.js GL state after host modifications',
  (t) => {
    const gc = testUtils.createGarbageCollector();
    const { gl, sharedWindow } = createSharedWindow(gc, t);

    const hostResources = createDirtyHostResources(gl);
    dirtyHostGLState(gl, hostResources);

    sharedWindow.renderShared();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const px = new Uint8Array(4);
    gl.readPixels(5, 5, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    t.ok(
      px[0] > 20 && px[1] > 40 && px[2] > 60,
      `Shared render cleared the full framebuffer despite host state, got rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    );

    deleteDirtyHostResources(gl, hostResources);
    gc.releaseResources();
    t.end();
  }
);

test.onlyIfWebGL(
  'Test renderShared draws into the currently bound host framebuffer',
  (t) => {
    const gc = testUtils.createGarbageCollector();
    const { gl, sharedWindow } = createSharedWindow(gc, t);

    const hostFramebuffer = createHostFramebuffer(gl, 400, 400);
    gl.bindFramebuffer(gl.FRAMEBUFFER, hostFramebuffer.framebuffer);
    t.equal(
      gl.checkFramebufferStatus(gl.FRAMEBUFFER),
      gl.FRAMEBUFFER_COMPLETE,
      'Host framebuffer is complete'
    );

    sharedWindow.renderShared();

    gl.bindFramebuffer(gl.FRAMEBUFFER, hostFramebuffer.framebuffer);
    const px = new Uint8Array(4);
    gl.readPixels(200, 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    t.ok(
      px[0] > 0 || px[1] > 0 || px[2] > 0,
      `Shared render wrote into the host framebuffer, got rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    deleteHostFramebuffer(gl, hostFramebuffer);
    gc.releaseResources();
    t.end();
  }
);
