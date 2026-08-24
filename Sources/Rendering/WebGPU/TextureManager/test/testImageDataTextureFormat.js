import { describe, expect, it } from 'vitest';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkWebGPUTextureManager from 'vtk.js/Sources/Rendering/WebGPU/TextureManager';

function createImageData(values) {
  const scalars = vtkDataArray.newInstance({
    name: 'Scalars',
    values,
    numberOfComponents: 1,
  });
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(values.length, 1, 1);
  imageData.getPointData().setScalars(scalars);
  return imageData;
}

function createTextureManager(supportsFloat32) {
  const textureManager = vtkWebGPUTextureManager.newInstance();
  const device = {
    getTextureManager: () => ({
      getTexture: (request) => ({ getFormat: () => request.format }),
    }),
    hasCachedObject: () => undefined,
    hasFeature: (name) => name === 'float32-filterable' && supportsFloat32,
  };
  textureManager.setDevice(device);
  return textureManager;
}

describe('vtkWebGPUTextureManager image data formats', () => {
  it.each([false, true])(
    'selects a stable format when float32 filter support is %s',
    (supportsFloat32) => {
      const textureManager = createTextureManager(supportsFloat32);

      const uint8Texture = textureManager.getTextureForImageData(
        createImageData(new Uint8Array([0, 255]))
      );
      expect(uint8Texture.getFormat()).toBe('r8unorm');

      const int8Texture = textureManager.getTextureForImageData(
        createImageData(new Int8Array([-128, 127]))
      );
      expect(int8Texture.getFormat()).toBe('r16float');

      const int16Image = createImageData(new Int16Array([-1, 1]));
      const int16Texture = textureManager.getTextureForImageData(int16Image);
      expect(int16Texture.getFormat()).toBe('r16float');

      const wideInt16Texture = textureManager.getTextureForImageData(
        createImageData(new Int16Array([-2049, 2049]))
      );
      expect(wideInt16Texture.getFormat()).toBe(
        supportsFloat32 ? 'r32float' : 'r16float'
      );

      const compactInt16Texture = textureManager.getTextureForImageData(
        int16Image,
        { preferSizeOverAccuracy: true }
      );
      expect(compactInt16Texture.getFormat()).toBe('r16float');

      const floatTexture = textureManager.getTextureForImageData(
        createImageData(new Float32Array([0.1, 0.2]))
      );
      expect(floatTexture.getFormat()).toBe('r16float');
    }
  );

  it('reuses the format memo when only image metadata is modified', () => {
    const values = new Int16Array([0, 4096]);
    const imageData = createImageData(values);
    const textureManager = createTextureManager(true);

    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      'r32float'
    );

    values[1] = 1;
    imageData.setOrigin(1, 2, 3);
    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      'r32float'
    );
  });

  it('checks the exact half precision values again after the image data changes', () => {
    const values = new Int16Array([0, 1]);
    const imageData = createImageData(values);
    const textureManager = createTextureManager(true);

    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      'r16float'
    );

    values[1] = 4096;
    imageData.modified();
    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      'r32float'
    );
  });

  it('uses the exact half precision format again while the image does not change', () => {
    const imageData = createImageData(new Int16Array([0, 1]));
    const textureManager = vtkWebGPUTextureManager.newInstance();
    let featureChecks = 0;
    textureManager.setDevice({
      getTextureManager: () => ({
        getTexture: (request) => ({ getFormat: () => request.format }),
      }),
      hasCachedObject: () => undefined,
      hasFeature: () => {
        featureChecks++;
        return true;
      },
    });

    textureManager.getTextureForImageData(imageData);
    textureManager.getTextureForImageData(imageData);

    expect(featureChecks).toBe(1);
  });

  it('memoizes both size-preference variants for one scalar array', () => {
    const imageData = createImageData(new Int16Array([0, 4096]));
    const textureManager = vtkWebGPUTextureManager.newInstance();
    let featureChecks = 0;
    textureManager.setDevice({
      getTextureManager: () => ({
        getTexture: (request) => ({ getFormat: () => request.format }),
      }),
      hasCachedObject: () => undefined,
      hasFeature: () => {
        featureChecks++;
        return true;
      },
    });

    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      'r32float'
    );
    expect(
      textureManager
        .getTextureForImageData(imageData, {
          preferSizeOverAccuracy: true,
        })
        .getFormat()
    ).toBe('r16float');
    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      'r32float'
    );
    expect(featureChecks).toBe(1);
  });

  it('uses half float storage for an empty scalar array', () => {
    const textureManager = createTextureManager(true);
    const texture = textureManager.getTextureForImageData(
      createImageData(new Float32Array())
    );

    expect(texture.getFormat()).toBe('r16float');
  });
});
