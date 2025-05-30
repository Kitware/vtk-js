import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkTexture methods
// ----------------------------------------------------------------------------

function vtkTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTexture');

  publicAPI.imageLoaded = () => {
    model.image.removeEventListener('load', publicAPI.imageLoaded);
    model.imageLoaded = true;
    publicAPI.modified();
  };

  publicAPI.setJsImageData = (imageData) => {
    if (model.jsImageData === imageData) {
      return;
    }

    // clear other entries
    if (imageData !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.image = null;
      model.canvas = null;
    }

    model.jsImageData = imageData;
    model.imageLoaded = true;
    publicAPI.modified();
  };

  publicAPI.setCanvas = (canvas) => {
    if (model.canvas === canvas) {
      return;
    }

    // clear other entries
    if (canvas !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.image = null;
      model.jsImageData = null;
    }

    model.canvas = canvas;
    publicAPI.modified();
  };

  publicAPI.setImage = (image) => {
    if (model.image === image) {
      return;
    }

    // clear other entries
    if (image !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
      model.canvas = null;
      model.jsImageData = null;
    }

    model.image = image;
    model.imageLoaded = false;

    if (image.complete) {
      publicAPI.imageLoaded();
    } else {
      image.addEventListener('load', publicAPI.imageLoaded);
    }

    publicAPI.modified();
  };

  publicAPI.getDimensionality = () => {
    let width = 0;
    let height = 0;
    let depth = 1;

    if (publicAPI.getInputData()) {
      const data = publicAPI.getInputData();
      width = data.getDimensions()[0];
      height = data.getDimensions()[1];
      depth = data.getDimensions()[2];
    }
    if (model.jsImageData) {
      width = model.jsImageData.width;
      height = model.jsImageData.height;
    }
    if (model.canvas) {
      width = model.canvas.width;
      height = model.canvas.height;
    }
    if (model.image) {
      width = model.image.width;
      height = model.image.height;
    }
    const dimensionality = (width > 1) + (height > 1) + (depth > 1);
    return dimensionality;
  };

  publicAPI.getInputAsJsImageData = () => {
    if (!model.imageLoaded || publicAPI.getInputData()) return null;

    if (model.jsImageData) {
      return model.jsImageData();
    }
    if (model.canvas) {
      const context = model.canvas.getContext('2d');
      const imageData = context.getImageData(
        0,
        0,
        model.canvas.width,
        model.canvas.height
      );
      return imageData;
    }
    if (model.image) {
      const canvas = document.createElement('canvas');
      canvas.width = model.image.width;
      canvas.height = model.image.height;
      const context = canvas.getContext('2d');
      context.translate(0, canvas.height);
      context.scale(1, -1);
      context.drawImage(
        model.image,
        0,
        0,
        model.image.width,
        model.image.height
      );
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      return imageData;
    }

    return null;
  };
}

const generateMipmaps = (nativeArray, width, height, level) => {
  // Define Gaussian kernels
  const kernels = {
    g3: { weights: [1, 2, 1], totalWeight: 4 },
    // g5: { weights: [1, 2, 4, 2, 1], totalWeight: 10 },
    // g7: { weights: [1, 2, 6, 8, 6, 2, 1], totalWeight: 26 }
  };

  const { weights } = kernels.g3;
  const kernelRadius = Math.floor(weights.length / 2);

  const channels = nativeArray.length / (width * height); // Components per pixel
  let currentWidth = width;
  let currentHeight = height;
  let imageData = nativeArray;
  const maps = [imageData];

  for (let i = 0; i < level; i++) {
    const prevData = imageData;
    currentWidth = Math.max(1, Math.floor(currentWidth / 2));
    currentHeight = Math.max(1, Math.floor(currentHeight / 2));
    const prevWidth = currentWidth * 2;

    // Allocate new smaller mipmap level
    imageData = new Uint8ClampedArray(currentWidth * currentHeight * channels);

    // Fast downsampling first (2x2 box filter)
    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        const targetIdx = (y * currentWidth + x) * channels;
        const sourceIdx = (y * 2 * prevWidth + x * 2) * channels;

        for (let c = 0; c < channels; c++) {
          // Average 4 pixels
          imageData[targetIdx + c] = Math.floor(
            (prevData[sourceIdx + c] +
              prevData[sourceIdx + channels + c] +
              prevData[sourceIdx + prevWidth * channels + c] +
              prevData[sourceIdx + prevWidth * channels + channels + c]) /
              4
          );
        }
      }
    }

    // Apply Gaussian blur for smoothing
    // Horizontal pass
    const tempData = new Uint8ClampedArray(imageData);
    const rowSize = currentWidth * channels;

    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        for (let c = 0; c < channels; c++) {
          const targetIdx = (y * currentWidth + x) * channels + c;
          let sum = 0;
          let usedWeight = 0;

          for (let k = -kernelRadius; k <= kernelRadius; k++) {
            const sourceX = Math.min(Math.max(0, x + k), currentWidth - 1);
            const sourceIdx = y * rowSize + sourceX * channels + c;
            const weight = weights[k + kernelRadius];

            sum += tempData[sourceIdx] * weight;
            usedWeight += weight;
          }

          imageData[targetIdx] = Math.round(sum / usedWeight);
        }
      }
    }

    // Vertical pass
    const tempData2 = new Uint8ClampedArray(imageData);

    for (let y = 0; y < currentHeight; y++) {
      for (let x = 0; x < currentWidth; x++) {
        for (let c = 0; c < channels; c++) {
          const targetIdx = (y * currentWidth + x) * channels + c;
          let sum = 0;
          let usedWeight = 0;

          for (let k = -kernelRadius; k <= kernelRadius; k++) {
            const sourceY = Math.min(Math.max(0, y + k), currentHeight - 1);
            const sourceIdx = sourceY * rowSize + x * channels + c;
            const weight = weights[k + kernelRadius];

            sum += tempData2[sourceIdx] * weight;
            usedWeight += weight;
          }

          imageData[targetIdx] = Math.round(sum / usedWeight);
        }
      }
    }

    maps.push(imageData);
  }
  return maps;
};

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  image: null,
  canvas: null,
  jsImageData: null,
  imageLoaded: false,
  repeat: false,
  interpolate: false,
  edgeClamp: false,
  mipLevel: 0,
  resizable: false, // must be set at construction time if the texture can be resizable
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 6, 0);

  macro.get(publicAPI, model, [
    'canvas',
    'image',
    'jsImageData',
    'imageLoaded',
    'resizable',
  ]);

  macro.setGet(publicAPI, model, [
    'repeat',
    'edgeClamp',
    'interpolate',
    'mipLevel',
  ]);

  vtkTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTexture');
export const STATIC = { generateMipmaps };

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
