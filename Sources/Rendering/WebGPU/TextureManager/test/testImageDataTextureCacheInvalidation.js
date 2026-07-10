import { it, expect } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTextureManager invalidates cached imageData textures',
  async () => {
    const device = await testUtils.createWebGPUTestDevice();

    try {
      const values = new Uint8Array(4 * 4).fill(10);
      const scalars = vtkDataArray.newInstance({
        name: 'Scalars',
        values,
        numberOfComponents: 1,
      });
      const imageData = vtkImageData.newInstance();
      imageData.setDimensions(4, 4, 1);
      imageData.getPointData().setScalars(scalars);

      const textureManager = device.getTextureManager();

      const texture = textureManager.getTextureForImageData(imageData);
      expect(
        textureManager.getTextureForImageData(imageData),
        'an unchanged imageData reuses the cached texture'
      ).toBe(texture);

      // Write the scalars in place and signal the change through
      // imageData.modified() alone — the pattern used by consumers that
      // stream new frames into an existing array (the OpenGL backend keys
      // its texture rebuilds on the imageData mtime, so this must also
      // refresh the WebGPU texture cache).
      values.fill(200);
      imageData.modified();
      const textureAfterImageDataModified =
        textureManager.getTextureForImageData(imageData);
      expect(
        textureAfterImageDataModified,
        'imageData.modified() alone must invalidate the cached texture'
      ).not.toBe(texture);

      // Direct scalar-array modification keeps invalidating as before.
      scalars.modified();
      expect(
        textureManager.getTextureForImageData(imageData),
        'scalars.modified() must invalidate the cached texture'
      ).not.toBe(textureAfterImageDataModified);
    } finally {
      device.getHandle().destroy();
    }
  }
);
