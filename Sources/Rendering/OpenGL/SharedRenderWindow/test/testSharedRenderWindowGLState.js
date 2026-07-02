import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import createSharedWindow from './helpers';

function createDirtyHostResources(gl) {
  return {
    arrayBuffer: gl.createBuffer(),
    elementArrayBuffer: gl.createBuffer(),
    renderbuffer: gl.createRenderbuffer(),
    texture: gl.createTexture(),
    pixelPackBuffer: gl.createBuffer(),
    pixelUnpackBuffer: gl.createBuffer(),
  };
}

function deleteDirtyHostResources(gl, resources) {
  gl.deleteBuffer(resources.arrayBuffer);
  gl.deleteBuffer(resources.elementArrayBuffer);
  gl.deleteRenderbuffer(resources.renderbuffer);
  gl.deleteTexture(resources.texture);
  gl.deleteBuffer(resources.pixelPackBuffer);
  gl.deleteBuffer(resources.pixelUnpackBuffer);
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

  // States resetGLState must normalize for vtk to render correctly.
  gl.enable(gl.RASTERIZER_DISCARD);
  gl.depthRange(0.2, 0.8);
  gl.enable(gl.SAMPLE_COVERAGE);
  gl.sampleCoverage(0.25, true);
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, resources.pixelPackBuffer);
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, resources.pixelUnpackBuffer);

  // Defaults that applyVTKRenderDefaults should restore.
  gl.disable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ONE, gl.ZERO);
  gl.depthFunc(gl.GREATER);
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

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test renderShared resets host GL state and applies vtk.js defaults',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { gl, sharedWindow } = createSharedWindow(gc);

    const hostResources = createDirtyHostResources(gl);
    dirtyHostGLState(gl, hostResources);

    sharedWindow.prepareSharedRender();

    expect(gl.isEnabled(gl.BLEND), 'Blending is enabled').toBe(true);
    expect(
      gl.getParameter(gl.BLEND_SRC_RGB),
      'RGB blend source matches vtk.js default'
    ).toBe(gl.SRC_ALPHA);
    expect(
      gl.getParameter(gl.DEPTH_FUNC),
      'Depth function matches vtk.js default'
    ).toBe(gl.LEQUAL);
    expect(
      gl.isEnabled(gl.RASTERIZER_DISCARD),
      'RASTERIZER_DISCARD disabled'
    ).toBe(false);
    expect(
      Array.from(gl.getParameter(gl.DEPTH_RANGE)),
      'DEPTH_RANGE reset to default'
    ).toEqual([0, 1]);
    expect(gl.isEnabled(gl.SAMPLE_COVERAGE), 'SAMPLE_COVERAGE disabled').toBe(
      false
    );
    expect(
      gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING),
      'PIXEL_PACK_BUFFER unbound'
    ).toBe(null);
    expect(
      gl.getParameter(gl.PIXEL_UNPACK_BUFFER_BINDING),
      'PIXEL_UNPACK_BUFFER unbound'
    ).toBe(null);

    sharedWindow.renderShared();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const px = new Uint8Array(4);
    gl.readPixels(5, 5, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    expect(
      px[0] > 20 && px[1] > 40 && px[2] > 60,
      `Shared render cleared the full framebuffer despite host state, got rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    ).toBeTruthy();

    deleteDirtyHostResources(gl, hostResources);
    gc.releaseResources();
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'Test renderShared draws into the currently bound host framebuffer',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { gl, sharedWindow } = createSharedWindow(gc);

    const hostFramebuffer = createHostFramebuffer(gl, 400, 400);
    gl.bindFramebuffer(gl.FRAMEBUFFER, hostFramebuffer.framebuffer);
    expect(
      gl.checkFramebufferStatus(gl.FRAMEBUFFER),
      'Host framebuffer is complete'
    ).toBe(gl.FRAMEBUFFER_COMPLETE);
    gl.drawBuffers([gl.NONE]);

    sharedWindow.renderShared();

    gl.bindFramebuffer(gl.FRAMEBUFFER, hostFramebuffer.framebuffer);
    const px = new Uint8Array(4);
    gl.readPixels(200, 200, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    expect(
      px[0] > 0 || px[1] > 0 || px[2] > 0,
      `Shared render wrote into the host framebuffer, got rgba(${px[0]},${px[1]},${px[2]},${px[3]})`
    ).toBeTruthy();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    deleteHostFramebuffer(gl, hostFramebuffer);
    gc.releaseResources();
  }
);
