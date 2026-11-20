import { afterEach, it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import { createTrackedRenderView } from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkOpenGLTexture from 'vtk.js/Sources/Rendering/OpenGL/Texture';

// For browsers without EXT_texture_norm16
const fakeNorm16Ext = {
  R16_EXT: 0x822a,
  RG16_EXT: 0x822c,
  RGB16_EXT: 0x8054,
  RGBA16_EXT: 0x805b,
  R16_SNORM_EXT: 0x8f98,
  RG16_SNORM_EXT: 0x8f99,
  RGB16_SNORM_EXT: 0x8f9a,
  RGBA16_SNORM_EXT: 0x8f9b,
};

const sideLen = 4;

let gc = null;

// Runs even if the test fails or is skipped
afterEach(() => {
  gc?.releaseResources();
  gc = null;
});

function createTexture(norm16Ext) {
  gc = testUtils.createGarbageCollector();
  const { view } = createTrackedRenderView(gc);
  const gl = view.getContext();

  const texture = gc.registerResource(vtkOpenGLTexture.newInstance());
  texture.setOpenGLRenderWindow(view);
  texture.setOglNorm16Ext(
    norm16Ext === undefined
      ? (gl.getExtension('EXT_texture_norm16') ?? fakeNorm16Ext)
      : norm16Ext
  );
  texture.resetFormatAndType();
  return { gl, texture };
}

// CT range, not exact in half float
function createCTArray() {
  return vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: Int16Array.from({ length: sideLen ** 3 }, (_, i) => -1024 + i * 64),
  });
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps norm16 when usable and preferring size over accuracy',
  () => {
    // Same size as half float, and exact
    const { gl, texture } = createTexture();
    texture.create3DFilterableFromDataArray({
      width: sideLen,
      height: sideLen,
      depth: sideLen,
      dataArray: createCTArray(),
      preferSizeOverAccuracy: true,
    });
    expect(texture.getOpenGLDataType()).toBe(gl.SHORT);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'uses half float over float when norm16 is not usable and preferring size',
  () => {
    // Mappers pass a null norm16 extension when it cannot be linearly filtered
    const { gl, texture } = createTexture(null);
    texture.create3DFilterableFromDataArray({
      width: sideLen,
      height: sideLen,
      depth: sideLen,
      dataArray: createCTArray(),
      preferSizeOverAccuracy: true,
    });
    expect(texture.getOpenGLDataType()).toBe(gl.HALF_FLOAT);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps the allocated data type on partial updates',
  () => {
    const { gl, texture } = createTexture(null);
    const dataArray = createCTArray();
    texture.create3DFilterableFromDataArray({
      width: sideLen,
      height: sideLen,
      depth: sideLen,
      dataArray,
      preferSizeOverAccuracy: true,
    });
    expect(texture.getOpenGLDataType()).toBe(gl.HALF_FLOAT);

    // Another mapper sharing the texture may not pass the flag
    texture.create3DFilterableFromDataArray({
      width: sideLen,
      height: sideLen,
      depth: sideLen,
      dataArray,
      updatedExtents: [[0, 1, 0, 1, 0, 1]],
    });
    expect(texture.getOpenGLDataType()).toBe(gl.HALF_FLOAT);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  }
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'keeps half float and clamps values above its finite range',
  (ctx) => {
    const { gl, texture } = createTexture(null);
    // Needed to read the half float texel back
    if (!gl.getExtension('EXT_color_buffer_float')) {
      ctx.skip();
    }

    // 65535 is above the largest finite half float (65504)
    const values = new Uint16Array(sideLen ** 3);
    values[values.length - 1] = 65535;
    texture.create3DFilterableFromDataArray({
      width: sideLen,
      height: sideLen,
      depth: sideLen,
      dataArray: vtkDataArray.newInstance({ numberOfComponents: 1, values }),
      preferSizeOverAccuracy: true,
    });
    expect(texture.getOpenGLDataType()).toBe(gl.HALF_FLOAT);

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTextureLayer(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      texture.getHandle(),
      0,
      sideLen - 1
    );
    const texel = new Float32Array(4);
    gl.readPixels(sideLen - 1, sideLen - 1, 1, 1, gl.RGBA, gl.FLOAT, texel);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    expect(texel[0]).toBe(65504);
  }
);
