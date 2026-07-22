import { it, expect } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTextureManager invalidates cached vtkTexture textures',
  async () => {
    const device = await testUtils.createWebGPUTestDevice();

    const values = new Uint8Array(4 * 4).fill(10);
    const scalars = vtkDataArray.newInstance({
      name: 'Scalars',
      values,
      numberOfComponents: 1,
    });
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(4, 4, 1);
    imageData.getPointData().setScalars(scalars);

    const srcTexture = vtkTexture.newInstance();
    srcTexture.setInputData(imageData);

    const textureManager = device.getTextureManager();

    const texture = textureManager.getTextureForVTKTexture(srcTexture);
    expect(
      textureManager.getTextureForVTKTexture(srcTexture) === texture,
      'an unchanged vtkTexture reuses the cached texture'
    ).toBe(true);

    // Write the scalars in place and signal the change through
    // imageData.modified() alone — the pattern used by consumers that
    // stream new frames into an existing array.
    values.fill(200);
    imageData.modified();
    const afterImageDataModified =
      textureManager.getTextureForVTKTexture(srcTexture);
    expect(
      afterImageDataModified === texture,
      'imageData.modified() alone must invalidate the cached texture'
    ).toBe(false);

    // The mtime seeded from the source texture must also keep counting:
    // srcTexture.modified() alone refreshes the cache entry.
    srcTexture.modified();
    const afterTextureModified =
      textureManager.getTextureForVTKTexture(srcTexture);
    expect(
      afterTextureModified === afterImageDataModified,
      'srcTexture.modified() alone must invalidate the cached texture'
    ).toBe(false);

    // Direct scalar-array modification keeps invalidating as before.
    scalars.modified();
    expect(
      textureManager.getTextureForVTKTexture(srcTexture) ===
        afterTextureModified,
      'scalars.modified() must invalidate the cached texture'
    ).toBe(false);
  }
);
