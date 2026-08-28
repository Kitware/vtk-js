import { expect, onTestFinished } from 'vitest';
import pixelmatch from 'pixelmatch';
import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkWebGPUDevice from 'vtk.js/Sources/Rendering/WebGPU/Device';

let REMOVE_DOM_ELEMENTS = true;

function createCanvasContext() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  return { canvas, context };
}

function getImageDataFromURI(imageDataURI) {
  return new Promise((resolve, reject) => {
    const { canvas, context } = createCanvasContext();
    const img = new Image();
    img.addEventListener('load', () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      resolve(context.getImageData(0, 0, img.width, img.height));
    });
    img.addEventListener('error', reject);
    img.src = imageDataURI;
  });
}

/**
 * Compares two images
 * @param image the image under test
 * @param baselines an array of baseline images
 * @param testName name used in assertion messages
 * @param opts if number: mismatch tolerance. if object: tolerance and pixel threshold
 */
async function compareImages(image, baselines, testName, opts) {
  // defaults
  let pixelThreshold = 0.1;
  let mismatchTolerance = 5; // percent

  if (typeof opts === 'number') {
    mismatchTolerance = opts;
  } else {
    pixelThreshold = opts?.pixelThreshold ?? pixelThreshold;
    mismatchTolerance = opts?.mismatchTolerance ?? mismatchTolerance;
  }

  let minDelta = 100;
  let minRawCount = 0;
  let minIndex = 0;
  let isSameDimensions = false;

  const imageUnderTest = await getImageDataFromURI(image);
  const baselineImages = await Promise.all(
    baselines.map((baseline) => getImageDataFromURI(baseline))
  );

  baselineImages.forEach((baseline, idx) => {
    const diff = createCanvasContext();
    const { width, height } = baseline;
    diff.canvas.width = width;
    diff.canvas.height = height;

    const diffImage = diff.context.createImageData(width, height);
    const mismatched = pixelmatch(
      imageUnderTest.data,
      baseline.data,
      diffImage.data,
      width,
      height,
      {
        alpha: 0.5,
        includeAA: false,
        threshold: pixelThreshold,
      }
    );

    const percentage = (100 * mismatched) / (width * height);
    if (percentage < minDelta) {
      minDelta = percentage;
      minRawCount = mismatched;
      minIndex = idx;
      isSameDimensions =
        width === imageUnderTest.width && height === imageUnderTest.height;
    }
  });

  expect(
    isSameDimensions,
    `[${testName}] image dimensions match baseline`
  ).toBe(true);
  const summary = `[${testName}] delta ${minDelta.toFixed(
    2
  )}% (count: ${minRawCount}, baseline: ${minIndex})`;
  expect(minDelta, summary).toBeLessThan(mismatchTolerance);
}

function createGarbageCollector() {
  const resources = [];
  const domElements = [];

  function registerResource(vtkObj, priority = 0) {
    resources.push({ vtkObj, priority });
    return vtkObj;
  }

  function registerDOMElement(el) {
    domElements.push(el);
    return el;
  }

  function releaseResources() {
    // DOM Element handling
    if (REMOVE_DOM_ELEMENTS) {
      domElements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }
    while (domElements.length) {
      domElements.pop();
    }

    // vtkObject handling
    resources.sort((a, b) => b.priority - a.priority);
    resources.forEach(({ vtkObj }) => {
      if (vtkObj) {
        vtkObj.delete();
      }
    });
    while (resources.length) {
      resources.pop();
    }
  }

  return {
    registerResource,
    registerDOMElement,
    releaseResources,
  };
}

/**
 * Convenience function to construct a test image.
 * @param {Number[]} size Dimensions of the image as an array of size 3.
 * @param {Number[]} spacing image voxel spacing.
 * @returns Constructed image as vtkImageData
 */
function createImage(size, spacing) {
  const source = vtkRTAnalyticSource.newInstance();
  source.setWholeExtent([0, size[0] - 1, 0, size[1] - 1, 0, size[2] - 1]);
  source.update();
  const image = source.getOutputData();
  image.setSpacing(spacing);
  return image;
}

function keepDOM() {
  REMOVE_DOM_ELEMENTS = false;
}

function removeDOM() {
  REMOVE_DOM_ELEMENTS = true;
}

function arrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function objEquals(a, b) {
  const k1 = Object.keys(a).sort();
  const k2 = Object.keys(b).sort();
  if (!arrayEquals(k1, k2)) {
    return false;
  }
  for (let i = 0; i < k1.length; ++i) {
    if (a[k1[i]] !== b[k1[i]]) {
      return false;
    }
  }
  return true;
}

function alignTo256(value) {
  return Math.ceil(value / 256) * 256;
}

// Counts live WebGL objects by wrapping the create/delete pairs on the
// rendering context prototypes.
function trackWebGLObjects() {
  const pairs = [
    ['createBuffer', 'deleteBuffer'],
    ['createFramebuffer', 'deleteFramebuffer'],
    ['createRenderbuffer', 'deleteRenderbuffer'],
    ['createTexture', 'deleteTexture'],
    ['createVertexArray', 'deleteVertexArray'],
  ];
  const prototypes = [
    globalThis.WebGL2RenderingContext?.prototype,
    globalThis.WebGLRenderingContext?.prototype,
  ].filter(Boolean);

  const live = new Set();

  function trackObjectType(prototype, createName, deleteName) {
    const create = prototype[createName];
    const remove = prototype[deleteName];
    function trackedCreate(...args) {
      const glObject = create.apply(this, args);
      live.add(glObject);
      return glObject;
    }
    function trackedDelete(glObject, ...args) {
      live.delete(glObject);
      return remove.call(this, glObject, ...args);
    }
    prototype[createName] = trackedCreate;
    prototype[deleteName] = trackedDelete;
    return () => {
      // Unwrap only our own wrappers, so overlapping trackers cannot
      // reinstall a dead one on the prototype
      if (prototype[createName] === trackedCreate) {
        prototype[createName] = create;
      }
      if (prototype[deleteName] === trackedDelete) {
        prototype[deleteName] = remove;
      }
    };
  }

  const restoreCallbacks = prototypes.flatMap((prototype) =>
    pairs
      // WebGL 1 has no vertex array objects
      .filter(([create, remove]) => prototype[create] && prototype[remove])
      .map(([create, remove]) => trackObjectType(prototype, create, remove))
  );

  function stop() {
    restoreCallbacks.forEach((restore) => restore());
    // Stop pinning the objects this tracker exists to detect
    live.clear();
  }
  onTestFinished(stop);

  return { count: () => live.size, stop };
}

function createRenderContainer(gc, size = 200) {
  const container = gc.registerDOMElement(document.createElement('div'));
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;
  document.querySelector('body').appendChild(container);
  return container;
}

async function createWebGPUTestDevice() {
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: 'high-performance',
  });
  if (!adapter) {
    throw new Error('Failed to acquire a WebGPU adapter.');
  }

  const handle = await adapter.requestDevice();
  onTestFinished(() => handle.destroy());
  const device = vtkWebGPUDevice.newInstance();
  device.initialize(handle);
  return device;
}

async function readWebGPUTexture2D(device, texture, width, height) {
  const bytesPerPixel = 4;
  const unpaddedBytesPerRow = width * bytesPerPixel;
  const bytesPerRow = alignTo256(unpaddedBytesPerRow);
  const bufferSize = bytesPerRow * height;

  const readBuffer = device.getHandle().createBuffer({
    size: bufferSize,
    /* eslint-disable no-undef */
    /* eslint-disable no-bitwise */
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const commandEncoder = device.getHandle().createCommandEncoder();
  commandEncoder.copyTextureToBuffer(
    {
      texture: texture.getHandle(),
      mipLevel: 0,
      origin: { x: 0, y: 0, z: 0 },
    },
    {
      buffer: readBuffer,
      bytesPerRow,
      rowsPerImage: height,
    },
    {
      width,
      height,
      depthOrArrayLayers: 1,
    }
  );
  device.getHandle().queue.submit([commandEncoder.finish()]);
  await device.getHandle().queue.onSubmittedWorkDone();

  /* eslint-disable no-undef */
  await readBuffer.mapAsync(GPUMapMode.READ);
  const mapped = new Uint8Array(readBuffer.getMappedRange());
  const result = new Uint8Array(unpaddedBytesPerRow * height);

  for (let row = 0; row < height; row++) {
    const srcStart = row * bytesPerRow;
    const dstStart = row * unpaddedBytesPerRow;
    result.set(
      mapped.subarray(srcStart, srcStart + unpaddedBytesPerRow),
      dstStart
    );
  }

  readBuffer.unmap();
  readBuffer.destroy();
  return result;
}

export default {
  arrayEquals,
  compareImages,
  createGarbageCollector,
  createImage,
  createRenderContainer,
  createWebGPUTestDevice,
  getImageDataFromURI,
  readWebGPUTexture2D,
  keepDOM,
  objEquals,
  removeDOM,
  trackWebGLObjects,
};
