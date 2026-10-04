import { it, expect } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

function makeFace(value, width = 4, height = width) {
  const scalars = vtkDataArray.newInstance({
    name: 'Scalars',
    values: new Uint8Array(width * height * 3).fill(value),
    numberOfComponents: 3,
  });
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(width, height, 1);
  imageData.getPointData().setScalars(scalars);
  return imageData;
}

function makeCubeTexture() {
  const srcTexture = vtkTexture.newInstance({ cubeMap: true });
  for (let i = 0; i < 6; i++) {
    srcTexture.setInputData(makeFace(i * 40), i);
  }
  return srcTexture;
}

it('Test vtkTexture.useCubeMap with and without the cubeMap flag', () => {
  const flagged = makeCubeTexture();
  expect(flagged.getCubeMap()).toBe(true);
  expect(vtkTexture.useCubeMap(flagged), 'flag and six faces').toBe(true);

  const sixFaces = vtkTexture.newInstance();
  expect(sixFaces.getCubeMap(), 'cubeMap is false by default').toBe(false);
  for (let i = 0; i < 6; i++) {
    sixFaces.setInputData(makeFace(i * 40), i);
  }
  expect(vtkTexture.useCubeMap(sixFaces), 'six faces without the flag').toBe(
    true
  );

  const fiveFaces = vtkTexture.newInstance({ cubeMap: true });
  for (let i = 0; i < 5; i++) {
    fiveFaces.setInputData(makeFace(i * 40), i);
  }
  expect(vtkTexture.useCubeMap(fiveFaces), 'flag with a missing face').toBe(
    false
  );

  const oneFace = vtkTexture.newInstance();
  oneFace.setInputData(makeFace(10));
  expect(vtkTexture.useCubeMap(oneFace), 'one 2D face').toBe(false);
});

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTextureManager uploads six faces as a cube map',
  async () => {
    const device = await testUtils.createWebGPUTestDevice();
    const textureManager = device.getTextureManager();
    const srcTexture = makeCubeTexture();

    const cubeTexture = textureManager.getTextureForVTKTexture(
      srcTexture,
      'DiffuseTexture',
      { allowCubeMap: true }
    );
    expect(cubeTexture.getDimension()).toBe('2d');
    expect(cubeTexture.getDepth(), 'one layer for each face').toBe(6);
    expect(cubeTexture.getFormat()).toBe('rgba8unorm');
    expect(cubeTexture.getReady()).toBe(true);
    expect(cubeTexture.createView('DiffuseTexture').getDimension()).toBe(
      'cube'
    );
    expect(
      textureManager.getTextureForVTKTexture(srcTexture, 'DiffuseTexture', {
        allowCubeMap: true,
      }),
      'an unchanged cube map reuses the cached texture'
    ).toBe(cubeTexture);

    const flatTexture = textureManager.getTextureForVTKTexture(srcTexture);
    expect(
      flatTexture,
      'without allowCubeMap the 2D texture of port 0 is used'
    ).not.toBe(cubeTexture);
    expect(flatTexture.getDepth()).toBe(1);
    expect(flatTexture.createView('DiffuseTexture').getDimension()).toBe('2d');

    srcTexture.getInputData(3).modified();
    expect(
      textureManager.getTextureForVTKTexture(srcTexture, 'DiffuseTexture', {
        allowCubeMap: true,
      }),
      'a modified face invalidates the cached cube map'
    ).not.toBe(cubeTexture);
  }
);

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test vtkWebGPUTextureManager uses a 2D texture for non square faces',
  async () => {
    const device = await testUtils.createWebGPUTestDevice();
    const textureManager = device.getTextureManager();
    const srcTexture = vtkTexture.newInstance({ cubeMap: true });
    for (let i = 0; i < 6; i++) {
      srcTexture.setInputData(makeFace(i * 40, 2, 4), i);
    }

    device.getHandle().pushErrorScope('validation');
    const texture = textureManager.getTextureForVTKTexture(
      srcTexture,
      'DiffuseTexture',
      { allowCubeMap: true }
    );
    const view = texture.createView('DiffuseTexture');
    const error = await device.getHandle().popErrorScope();

    expect(error, 'no WebGPU validation error').toBe(null);
    expect(texture.getDepth(), 'the 2D texture of port 0').toBe(1);
    expect(view.getDimension()).toBe('2d');
  }
);
