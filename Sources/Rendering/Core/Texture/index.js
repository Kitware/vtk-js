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

// Use nativeArray instead of self
const generateMipmaps = (nativeArray, width, height, level) => {
  // TODO: FIX UNEVEN TEXTURE MIP GENERATION:
  // When textures don't have standard ratios, higher mip levels
  // result in their color chanels getting messed up and shifting
  // 3x3 gaussian kernel
  const g3m = [1, 2, 1]; // eslint-disable-line
  const g3w = 4; // eslint-disable-line
  // 5x5 gaussian kernel
  const g5m = [1, 2, 4, 2, 1]; // eslint-disable-line
  const g5w = 10; // eslint-disable-line
  // 7x7 gaussian kernel
  const g7m = [1, 2, 6, 8, 6, 2, 1]; // eslint-disable-line
  const g7w = 26; // eslint-disable-line

  const kernel = g3m;
  const kernelWeight = g3w;

  const hs = nativeArray.length / (width * height); // TODO: support for textures with depth more than 1
  let currentWidth = width;
  let currentHeight = height;
  let imageData = nativeArray;
  const maps = [imageData];

  for (let i = 0; i < level; i++) {
    const oldData = [...imageData];
    currentWidth /= 2;
    currentHeight /= 2;
    imageData = new Uint8ClampedArray(currentWidth * currentHeight * hs);
    const vs = hs * currentWidth;

    // Scale down
    let shift = 0;
    for (let p = 0; p < imageData.length; p += hs) {
      if (p % vs === 0) {
        shift += 2 * hs * currentWidth;
      }

      for (let c = 0; c < hs; c++) {
        let sample = oldData[shift + c];
        sample += oldData[shift + hs + c];
        sample += oldData[shift - 2 * vs + c];
        sample += oldData[shift - 2 * vs + hs + c];
        sample /= 4;
        imageData[p + c] = sample;
      }

      shift += 2 * hs;
    }

    // Horizontal Pass
    let dataCopy = [...imageData];
    for (let p = 0; p < imageData.length; p += hs) {
      for (let c = 0; c < hs; c++) {
        let x = -(kernel.length - 1) / 2;
        let kw = kernelWeight;
        let value = 0.0;
        for (let k = 0; k < kernel.length; k++) {
          let index = p + c + x * hs;
          const lineShift = (index % vs) - ((p + c) % vs);
          if (lineShift > hs) index += vs;
          if (lineShift < -hs) index -= vs;
          if (dataCopy[index]) {
            value += dataCopy[index] * kernel[k];
          } else {
            kw -= kernel[k];
          }
          x += 1;
        }
        imageData[p + c] = value / kw;
      }
    }
    // Vertical Pass
    dataCopy = [...imageData];
    for (let p = 0; p < imageData.length; p += hs) {
      for (let c = 0; c < hs; c++) {
        let x = -(kernel.length - 1) / 2;
        let kw = kernelWeight;
        let value = 0.0;
        for (let k = 0; k < kernel.length; k++) {
          const index = p + c + x * vs;
          if (dataCopy[index]) {
            value += dataCopy[index] * kernel[k];
          } else {
            kw -= kernel[k];
          }
          x += 1;
        }
        imageData[p + c] = value / kw;
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
