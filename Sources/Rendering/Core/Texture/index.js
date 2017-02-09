import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkTexture methods
// ----------------------------------------------------------------------------

function vtkTexture(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTexture');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  repeat: false,
  interpolate: false,
  edgeClamp: false,
  image: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 1, 0);

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
