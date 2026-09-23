import { describe, expect, it, vi } from 'vitest';

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

function createFakeTexture(req) {
  let destroyed = false;
  return {
    format: req.format,
    getFormat: () => req.format,
    getWidth: () => req.width,
    getHeight: () => req.height,
    getDepth: () => req.depth,
    getMipLevel: () => req.mipLevel ?? 0,
    getUsage: () => req.usage,
    getHandle: () => (destroyed ? null : {}),
    writeImageData: vi.fn(),
    writeSubImageData: vi.fn(() => true),
    generateMipmaps: () => {},
    destroy: vi.fn(() => {
      destroyed = true;
    }),
  };
}

// A device with a real hash cache and a submit that runs the deferred
// callbacks. Created textures are recorded.
function createDevice(features) {
  const cache = new Map();
  let callbacks = [];
  const created = [];
  const textureManager = vtkWebGPUTextureManager.newInstance();
  const device = {
    created,
    hasFeature: (name) => features.includes(name),
    hasCachedObject: (hash) => cache.get(hash),
    getCachedObject: (hash, creator, ...args) => {
      if (!cache.has(hash)) {
        cache.set(hash, creator(...args));
      }
      return cache.get(hash);
    },
    removeCachedObject: (value) => {
      cache.forEach((entry, key) => {
        if (entry === value) {
          cache.delete(key);
        }
      });
    },
    afterNextSubmit: (callback) => callbacks.push(callback),
    submit: () => {
      const pending = callbacks;
      callbacks = [];
      pending.forEach((callback) => callback());
    },
    getTextureManager: () => ({
      getTexture: (req) =>
        device.getCachedObject(req.hash, () => {
          const texture = createFakeTexture(req);
          created.push(texture);
          return texture;
        }),
    }),
  };
  textureManager.setDevice(device);
  return { device, textureManager };
}

describe('vtkWebGPUTextureManager texture ownership', () => {
  it('destroys a replaced texture after its last owner changes', () => {
    const { device, textureManager } = createDevice([]);
    const imageData = createImageData(new Float32Array([0, 1]));
    const ownerA = {};
    const ownerB = {};

    const first = textureManager.getTextureForImageData(imageData, {
      owner: ownerA,
    });
    expect(
      textureManager.getTextureForImageData(imageData, { owner: ownerB })
    ).toBe(first);

    // A different image makes owner A change texture. Owner B still holds
    // the first texture.
    textureManager.getTextureForImageData(
      createImageData(new Float32Array([2, 3, 4])),
      { owner: ownerA }
    );
    device.submit();
    expect(first.destroy).not.toHaveBeenCalled();

    textureManager.releaseTexture(ownerB);
    expect(first.destroy).not.toHaveBeenCalled();
    device.submit();
    expect(first.destroy).toHaveBeenCalledOnce();
  });

  it('never destroys a texture that a caller got without an owner', () => {
    const { device, textureManager } = createDevice([]);
    const imageData = createImageData(new Float32Array([0, 1]));
    const owner = {};

    const texture = textureManager.getTextureForImageData(imageData, {
      owner,
    });
    textureManager.getTextureForImageData(imageData);
    textureManager.releaseTexture(owner);
    device.submit();

    expect(texture.destroy).not.toHaveBeenCalled();
  });

  it('shares one float32 texture after the values stop fitting half float', () => {
    const { device, textureManager } = createDevice(['float32-filterable']);
    const imageData = createImageData(new Int16Array([0, 1, 2, 3]));
    const scalars = imageData.getPointData().getScalars();
    const values = scalars.getData();
    const ownerA = {};
    const ownerB = {};

    const halfFloatTexture = textureManager.getTextureForImageData(imageData, {
      owner: ownerA,
    });
    expect(halfFloatTexture.getFormat()).toBe('r16float');
    textureManager.getTextureForImageData(imageData, { owner: ownerB });

    // Owner A receives a value that half float cannot hold.
    values[0] = 5000;
    scalars.modified();
    const promotedTexture = textureManager.getTextureForImageData(imageData, {
      owner: ownerA,
      existingTexture: halfFloatTexture,
      updatedExtents: [[0, 0, 0, 0, 0, 0]],
    });
    expect(promotedTexture.getFormat()).toBe('r32float');

    // Owner B renders later, after one more update whose values fit half
    // float. It uses the same float32 texture instead of a new copy.
    values[1] = 7;
    scalars.modified();
    const textureB = textureManager.getTextureForImageData(imageData, {
      owner: ownerB,
      existingTexture: halfFloatTexture,
      updatedExtents: [[1, 1, 0, 0, 0, 0]],
    });
    expect(textureB).toBe(promotedTexture);
    expect(promotedTexture.writeImageData).toHaveBeenCalledOnce();
    expect(device.created).toHaveLength(2);

    device.submit();
    expect(halfFloatTexture.destroy).toHaveBeenCalledOnce();
    expect(promotedTexture.destroy).not.toHaveBeenCalled();
  });

  it('writes a full upload into the live texture of the data array', () => {
    const { device, textureManager } = createDevice([]);
    const imageData = createImageData(new Float32Array([0, 1]));
    const owner = {};

    const first = textureManager.getTextureForImageData(imageData, { owner });
    imageData.getPointData().getScalars().modified();
    const second = textureManager.getTextureForImageData(imageData, {
      owner,
    });

    expect(second).toBe(first);
    expect(first.writeImageData).toHaveBeenCalledOnce();
    expect(device.created).toHaveLength(1);
  });
});

describe('vtkWebGPUTextureManager normalized 16 bit formats', () => {
  it.each([
    [new Int16Array([-30000, 30000]), 'r16snorm'],
    [new Uint16Array([0, 60000]), 'r16unorm'],
  ])('stores %o in 2 bytes as %s', (values, format) => {
    const { textureManager } = createDevice([
      'float32-filterable',
      'texture-formats-tier1',
    ]);
    const imageData = createImageData(values);

    expect(textureManager.getTextureForImageData(imageData).getFormat()).toBe(
      format
    );
    expect(
      textureManager
        .getTextureForImageData(imageData, { preferSizeOverAccuracy: true })
        .getFormat()
    ).toBe(format);
  });

  it('keeps r16snorm for a partial update', () => {
    const { device, textureManager } = createDevice([
      'float32-filterable',
      'texture-formats-tier1',
    ]);
    const imageData = createImageData(new Int16Array([0, 1, 2, 3]));
    const scalars = imageData.getPointData().getScalars();
    const texture = textureManager.getTextureForImageData(imageData);

    scalars.getData()[2] = -32000;
    scalars.modified();
    const patched = textureManager.getTextureForImageData(imageData, {
      existingTexture: texture,
      updatedExtents: [[2, 2, 0, 0, 0, 0]],
    });

    expect(patched).toBe(texture);
    expect(texture.writeSubImageData).toHaveBeenCalledOnce();
    expect(device.created).toHaveLength(1);
  });
});
