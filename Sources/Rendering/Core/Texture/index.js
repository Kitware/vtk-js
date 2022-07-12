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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  repeat: false,
  interpolate: false,
  edgeClamp: false,
  image: null,
  canvas: null,
  imageLoaded: false,
  jsImageData: null,
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
  ]);

  macro.setGet(publicAPI, model, ['repeat', 'edgeClamp', 'interpolate']);

  vtkTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTexture');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
