import { describe, expect, it } from 'vitest';

import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkWebGPUTextureManager from 'vtk.js/Sources/Rendering/WebGPU/TextureManager';

/* eslint-disable no-undef */
/* eslint-disable no-bitwise */
const DEFAULT_TEXTURE_USAGE =
  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
const MIPMAP_TEXTURE_USAGE =
  DEFAULT_TEXTURE_USAGE | GPUTextureUsage.STORAGE_BINDING;
/* eslint-enable no-bitwise */
/* eslint-enable no-undef */

function createImageData() {
  const values = new Int16Array(24);
  for (let i = 0; i < values.length; i++) {
    values[i] = i;
  }

  const scalars = vtkDataArray.newInstance({
    name: 'Scalars',
    values,
    numberOfComponents: 1,
  });
  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(4, 3, 2);
  imageData.getPointData().setScalars(scalars);
  return imageData;
}

function getWriteRequest(
  extent,
  hasCachedObject = false,
  imageData = null,
  supportsFloat32 = false
) {
  let writeRequest;
  const existingTexture = {
    getDepth: () => 2,
    getFormat: () => 'r16float',
    getHandle: () => ({}),
    getHeight: () => 3,
    getMipLevel: () => 0,
    getUsage: () => DEFAULT_TEXTURE_USAGE,
    getWidth: () => 4,
    writeSubImageData: (request) => {
      writeRequest = request;
    },
  };
  const textureManager = vtkWebGPUTextureManager.newInstance();
  const device = {
    getCachedObject: (hash, createTexture) => createTexture(),
    hasCachedObject: () => {
      if (hasCachedObject) {
        return existingTexture;
      }
      return undefined;
    },
    hasFeature: (name) => name === 'float32-filterable' && supportsFloat32,
  };
  textureManager.setDevice(device);
  textureManager.getTextureForImageData(imageData || createImageData(), {
    existingTexture,
    updatedExtents: [extent],
  });
  return writeRequest;
}

describe('vtkWebGPUTextureManager partial texture updates', () => {
  it('passes the full source and its layout to the texture', () => {
    const request = getWriteRequest([1, 2, 1, 2, 0, 1]);
    expect(Array.from(request.nativeArray)).toEqual(
      Array.from({ length: 24 }, (_, index) => index)
    );
    expect(request.sourceLayout).toEqual({
      width: 4,
      height: 3,
      depth: 2,
      x: 1,
      y: 1,
      z: 0,
    });
    expect([request.width, request.height, request.depth]).toEqual([2, 2, 2]);
  });

  it('writes updated extents when the texture hash is already cached', () => {
    const request = getWriteRequest([1, 2, 1, 2, 0, 1], true);
    expect(request).toBeDefined();
  });

  it('builds a new texture if the partial write fails', () => {
    const imageData = createImageData();
    const rebuiltTexture = {};
    let cachedPatch = false;
    const existingTexture = {
      getDepth: () => 2,
      getFormat: () => 'r16float',
      getHandle: () => ({}),
      getHeight: () => 3,
      getMipLevel: () => 0,
      getUsage: () => DEFAULT_TEXTURE_USAGE,
      getWidth: () => 4,
      writeSubImageData: () => false,
    };
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getCachedObject: () => {
        cachedPatch = true;
      },
      getTextureManager: () => ({ getTexture: () => rebuiltTexture }),
      hasCachedObject: () => undefined,
      hasFeature: () => true,
    });

    const result = textureManager.getTextureForImageData(imageData, {
      existingTexture,
      updatedExtents: [[0, 1, 0, 1, 0, 0]],
    });

    expect(result).toBe(rebuiltTexture);
    expect(cachedPatch).toBe(false);
  });

  it('does not scan values outside the declared update extents', () => {
    const imageData = createImageData();
    imageData.getPointData().getScalars().getData()[0] = 4096;
    const request = getWriteRequest([1, 2, 1, 2, 0, 1], false, imageData, true);
    expect(request).toBeDefined();
  });

  it('promotes the format when an updated extent crosses the limit', () => {
    const imageData = createImageData();
    imageData.getPointData().getScalars().getData()[5] = 4096;
    let rebuiltFormat;
    const existingTexture = {
      getDepth: () => 2,
      getFormat: () => 'r16float',
      getHandle: () => ({}),
      getHeight: () => 3,
      getMipLevel: () => 0,
      getUsage: () => DEFAULT_TEXTURE_USAGE,
      getWidth: () => 4,
      writeSubImageData: () => {},
    };
    const rebuiltTexture = {};
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getTextureManager: () => ({
        getTexture: (request) => {
          rebuiltFormat = request.format;
          return rebuiltTexture;
        },
      }),
      hasCachedObject: () => undefined,
      hasFeature: () => true,
    });

    const result = textureManager.getTextureForImageData(imageData, {
      existingTexture,
      updatedExtents: [[1, 2, 1, 2, 0, 1]],
    });

    expect(result).toBe(rebuiltTexture);
    expect(rebuiltFormat).toBe('r32float');
  });

  it('patches the canonical cached texture shared by another mapper', () => {
    const createTexture = () => {
      let writeCount = 0;
      return {
        getDepth: () => 2,
        getFormat: () => 'r16float',
        getHandle: () => ({}),
        getHeight: () => 3,
        getMipLevel: () => 0,
        getUsage: () => DEFAULT_TEXTURE_USAGE,
        getWidth: () => 4,
        getWriteCount: () => writeCount,
        writeSubImageData: () => {
          writeCount++;
        },
      };
    };
    const existingTexture = createTexture();
    const cachedTexture = createTexture();
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      hasCachedObject: () => cachedTexture,
      hasFeature: () => false,
    });

    const result = textureManager.getTextureForImageData(createImageData(), {
      existingTexture,
      updatedExtents: [[1, 2, 1, 2, 0, 1]],
    });

    expect(result).toBe(cachedTexture);
    expect(cachedTexture.getWriteCount()).toBe(1);
    expect(existingTexture.getWriteCount()).toBe(0);
  });

  it('rebuilds when the scalar element type changes', () => {
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(4, 3, 2);
    imageData.getPointData().setScalars(
      vtkDataArray.newInstance({
        name: 'RGBA',
        values: new Int16Array(4 * 3 * 2 * 4),
        numberOfComponents: 4,
      })
    );
    let rebuiltFormat;
    let writeCount = 0;
    const existingTexture = {
      getDepth: () => 2,
      getFormat: () => 'rgba8unorm',
      getHandle: () => ({}),
      getHeight: () => 3,
      getMipLevel: () => 0,
      getUsage: () => DEFAULT_TEXTURE_USAGE,
      getWidth: () => 4,
      writeSubImageData: () => {
        writeCount++;
      },
    };
    const rebuiltTexture = {};
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getTextureManager: () => ({
        getTexture: (request) => {
          rebuiltFormat = request.format;
          return rebuiltTexture;
        },
      }),
      hasCachedObject: () => undefined,
      hasFeature: () => false,
    });

    const result = textureManager.getTextureForImageData(imageData, {
      existingTexture,
      updatedExtents: [[1, 2, 1, 2, 0, 1]],
    });

    expect(result).toBe(rebuiltTexture);
    expect(rebuiltFormat).toBe('rgba16float');
    expect(writeCount).toBe(0);
  });

  it('rebuilds when the existing texture format is unknown', () => {
    const existingTexture = {
      getFormat: () => 'unknown-format',
    };
    const rebuiltTexture = {};
    let rebuiltFormat;
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getTextureManager: () => ({
        getTexture: (request) => {
          rebuiltFormat = request.format;
          return rebuiltTexture;
        },
      }),
      hasCachedObject: () => undefined,
      hasFeature: () => false,
    });

    const previousErrorLogger = console.error;
    macro.setLoggerFunction('error', () => {});
    let result;
    try {
      result = textureManager.getTextureForImageData(createImageData(), {
        existingTexture,
        updatedExtents: [[1, 2, 1, 2, 0, 1]],
      });
    } finally {
      macro.setLoggerFunction('error', previousErrorLogger);
    }

    expect(result).toBe(rebuiltTexture);
    expect(rebuiltFormat).toBe('r16float');
  });

  it.each([
    { mipLevel: 0, usage: undefined, name: 'mip level' },
    { mipLevel: 2, usage: 0, name: 'usage' },
  ])('does not patch a texture with incompatible $name', (textureOptions) => {
    const values = new Uint8Array(4 * 4 * 4);
    const scalars = vtkDataArray.newInstance({
      name: 'RGBA',
      values,
      numberOfComponents: 4,
    });
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(4, 4, 1);
    imageData.getPointData().setScalars(scalars);

    let writeCount = 0;
    const existingTexture = {
      getDepth: () => 1,
      getFormat: () => 'rgba8unorm',
      getHandle: () => ({}),
      getHeight: () => 4,
      getMipLevel: () => textureOptions.mipLevel,
      getUsage: () => textureOptions.usage,
      getWidth: () => 4,
      writeSubImageData: () => {
        writeCount++;
      },
    };
    const rebuiltTexture = {};
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getTextureManager: () => ({ getTexture: () => rebuiltTexture }),
      hasCachedObject: () => undefined,
      hasFeature: () => false,
    });

    const result = textureManager.getTextureForImageData(imageData, {
      existingTexture,
      generateMipmaps: true,
      updatedExtents: [[0, 3, 0, 3, 0, 0]],
    });

    expect(writeCount).toBe(0);
    expect(result).toBe(rebuiltTexture);
  });

  it('does not patch extra usage flags into a plain texture request', () => {
    const existingTexture = {
      getDepth: () => 2,
      getFormat: () => 'r16float',
      getHandle: () => ({}),
      getHeight: () => 3,
      getMipLevel: () => 0,
      getUsage: () => MIPMAP_TEXTURE_USAGE,
      getWidth: () => 4,
      writeSubImageData: () => {
        throw new Error('The incompatible texture must not be patched');
      },
    };
    const rebuiltTexture = {};
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getTextureManager: () => ({ getTexture: () => rebuiltTexture }),
      hasCachedObject: () => undefined,
      hasFeature: () => false,
    });

    const result = textureManager.getTextureForImageData(createImageData(), {
      existingTexture,
      updatedExtents: [[0, 1, 0, 1, 0, 0]],
    });

    expect(result).toBe(rebuiltTexture);
  });

  it('regenerates mipmaps once after all updated extents are written', () => {
    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(4, 4, 1);
    imageData.getPointData().setScalars(
      vtkDataArray.newInstance({
        name: 'RGBA',
        values: new Uint8Array(4 * 4 * 4),
        numberOfComponents: 4,
      })
    );

    let mipmapCount = 0;
    const writeRequests = [];
    const mipLevel = 2;
    const existingTexture = {
      generateMipmaps: () => {
        mipmapCount++;
      },
      getDepth: () => 1,
      getFormat: () => 'rgba8unorm',
      getHandle: () => ({}),
      getHeight: () => 4,
      getMipLevel: () => mipLevel,
      getUsage: () => MIPMAP_TEXTURE_USAGE,
      getWidth: () => 4,
      writeSubImageData: (request) => writeRequests.push(request),
    };
    const textureManager = vtkWebGPUTextureManager.newInstance();
    textureManager.setDevice({
      getCachedObject: (hash, createTexture) => createTexture(),
      hasCachedObject: () => undefined,
      hasFeature: () => false,
    });

    textureManager.getTextureForImageData(imageData, {
      existingTexture,
      generateMipmaps: true,
      updatedExtents: [
        [0, 1, 0, 1, 0, 0],
        [2, 3, 2, 3, 0, 0],
      ],
    });

    expect(writeRequests).toHaveLength(2);
    expect(writeRequests.every((request) => request.deferMipmaps)).toBe(true);
    expect(mipmapCount).toBe(1);
  });
});
