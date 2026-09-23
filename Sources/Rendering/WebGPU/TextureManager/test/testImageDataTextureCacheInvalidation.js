import { it, expect, vi } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTextureManager invalidates cached imageData textures',
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

    const textureManager = device.getTextureManager();

    const texture = textureManager.getTextureForImageData(imageData);
    // VTK.js objects are frozen, so watch the uploads on the GPU queue.
    const writeTexture = vi.spyOn(device.getHandle().queue, 'writeTexture');
    expect(
      textureManager.getTextureForImageData(imageData),
      'an unchanged imageData reuses the cached texture'
    ).toBe(texture);
    expect(writeTexture).not.toHaveBeenCalled();

    // Write the scalars in place and signal the change through
    // imageData.modified() alone — the pattern used by consumers that
    // stream new frames into an existing array (the OpenGL backend keys
    // its texture rebuilds on the imageData mtime, so this must also
    // refresh the WebGPU texture cache). The new content is written into
    // the existing texture of the data array, so the texture object stays
    // the same and a full upload occurs.
    values.fill(200);
    imageData.modified();
    expect(
      textureManager.getTextureForImageData(imageData),
      'imageData.modified() alone must invalidate the cached texture'
    ).toBe(texture);
    expect(writeTexture).toHaveBeenCalledOnce();
    const [destination, data] = writeTexture.mock.calls[0];
    expect(destination.texture).toBe(texture.getHandle());
    expect(Array.from(new Uint8Array(data.buffer, data.byteOffset, 4))).toEqual(
      [200, 200, 200, 200]
    );

    // Direct scalar-array modification keeps invalidating as before.
    scalars.modified();
    expect(
      textureManager.getTextureForImageData(imageData),
      'scalars.modified() must invalidate the cached texture'
    ).toBe(texture);
    expect(writeTexture).toHaveBeenCalledTimes(2);
    writeTexture.mockRestore();
  }
);
