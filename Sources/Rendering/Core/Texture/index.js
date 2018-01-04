import macro from 'vtk.js/Sources/macro';

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

  publicAPI.setImage = (image) => {
    if (model.image === image) {
      return;
    }

    if (image !== null) {
      publicAPI.setInputData(null);
      publicAPI.setInputConnection(null);
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  repeat: false,
  interpolate: false,
  edgeClamp: false,
  image: null,
  imageLoaded: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 6, 0);

  macro.get(publicAPI, model, ['imageLoaded']);

  macro.setGet(publicAPI, model, [
    'repeat',
    'edgeClamp',
    'interpolate',
    'image',
  ]);

  vtkTexture(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTexture');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
