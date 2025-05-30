import test from 'tape';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

function createTestImage(width, height, channels, pattern = 'gradient') {
  const size = width * height * channels;
  const data = new Uint8ClampedArray(size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;

      switch (pattern) {
        case 'gradient':
          data[idx] = Math.floor((x / width) * 255); // Red
          data[idx + 1] = Math.floor((y / height) * 255); // Green
          data[idx + 2] = 128; // Blue
          if (channels === 4) data[idx + 3] = 255; // Alpha
          break;

        case 'checkerboard':
          // eslint-disable-next-line no-case-declarations
          const checker = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) * 255;
          data[idx] = checker;
          data[idx + 1] = checker;
          data[idx + 2] = checker;
          if (channels === 4) data[idx + 3] = 255;
          break;

        case 'solid':
          data[idx] = 255; // Red
          data[idx + 1] = 128; // Green
          data[idx + 2] = 64; // Blue
          if (channels === 4) data[idx + 3] = 255; // Alpha
          break;
        default:
          throw new Error(`Unknown pattern: ${pattern}`);
      }
    }
  }

  return data;
}

test('vtkTexture: Basic mipmap generation', (t) => {
  const data = createTestImage(4, 4, 3, 'solid');
  const mipmaps = vtkTexture.generateMipmaps(data, 4, 4, 2);

  t.equal(mipmaps.length, 3, 'Should generate correct number of mipmaps');
  t.equal(mipmaps[0].length, 48, 'Original should be 4x4x3 = 48 bytes');
  t.equal(mipmaps[1].length, 12, 'Level 1 should be 2x2x3 = 12 bytes');
  t.equal(mipmaps[2].length, 3, 'Level 2 should be 1x1x3 = 3 bytes');
  t.end();
});

test('vtkTexture: RGBA channel support', (t) => {
  const data = createTestImage(8, 8, 4, 'solid');
  const mipmaps = vtkTexture.generateMipmaps(data, 8, 8, 3);

  t.equal(mipmaps.length, 4, 'Should generate correct number of mipmaps');
  t.equal(mipmaps[0].length, 256, 'Original should be 8x8x4 = 256 bytes');
  t.equal(mipmaps[1].length, 64, 'Level 1 should be 4x4x4 = 64 bytes');
  t.equal(mipmaps[2].length, 16, 'Level 2 should be 2x2x4 = 16 bytes');
  t.equal(mipmaps[3].length, 4, 'Level 3 should be 1x1x4 = 4 bytes');
  t.end();
});

test('vtkTexture: Non-power-of-2 dimensions', (t) => {
  const data = createTestImage(6, 10, 3, 'gradient');
  const mipmaps = vtkTexture.generateMipmaps(data, 6, 10, 3);

  t.equal(mipmaps.length, 4, 'Should handle non-power-of-2 dimensions');
  t.equal(mipmaps[0].length, 180, 'Original should be 6x10x3 = 180 bytes');
  t.equal(mipmaps[1].length, 45, 'Level 1 should be 3x5x3 = 45 bytes');
  t.end();
});

test('vtkTexture: Single pixel image', (t) => {
  const data = new Uint8ClampedArray([255, 128, 64]);
  const mipmaps = vtkTexture.generateMipmaps(data, 1, 1, 2);
  t.equal(mipmaps.length, 3, 'Should handle 1x1 image');
  t.deepEqual(
    mipmaps[0],
    new Uint8ClampedArray([255, 128, 64]),
    'Original pixel should be preserved'
  );
  t.end();
});

test('vtkTexture: Zero mipmap levels', (t) => {
  const data = createTestImage(4, 4, 3, 'solid');
  const mipmaps = vtkTexture.generateMipmaps(data, 4, 4, 0);

  t.equal(mipmaps.length, 1, 'Should return only original image');
  t.equal(mipmaps[0], data, 'Should return reference to original data');
  t.end();
});

test('vtkTexture: Data integrity check', (t) => {
  const data = createTestImage(4, 4, 4, 'checkerboard');
  const originalData = new Uint8ClampedArray(data);
  const mipmaps = vtkTexture.generateMipmaps(data, 4, 4, 2);

  t.deepEqual(mipmaps[0], originalData, 'Original data should not be modified');

  // Check that all values are within valid range
  for (let level = 0; level < mipmaps.length; level++) {
    for (let i = 0; i < mipmaps[level].length; i++) {
      t.ok(
        mipmaps[level][i] >= 0 && mipmaps[level][i] <= 255,
        `Value at level ${level}, index ${i} is out of range: ${mipmaps[level][i]}`
      );
    }
  }
  t.end();
});
