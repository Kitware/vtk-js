import { it, expect } from 'vitest';
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

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'uses half float over norm16 when preferring size over accuracy',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { view } = createTrackedRenderView(gc);
    const gl = view.getContext();

    const texture = gc.registerResource(vtkOpenGLTexture.newInstance());
    texture.setOpenGLRenderWindow(view);
    texture.setOglNorm16Ext(
      gl.getExtension('EXT_texture_norm16') ?? fakeNorm16Ext
    );
    texture.resetFormatAndType();
    // CT range, not exact in half float
    const sideLen = 4;
    texture.create3DFilterableFromDataArray({
      width: sideLen,
      height: sideLen,
      depth: sideLen,
      dataArray: vtkDataArray.newInstance({
        numberOfComponents: 1,
        values: Int16Array.from(
          { length: sideLen ** 3 },
          (_, i) => -1024 + i * 64
        ),
      }),
      preferSizeOverAccuracy: true,
    });
    expect(texture.getOpenGLDataType()).toBe(gl.HALF_FLOAT);

    gc.releaseResources();
  }
);
