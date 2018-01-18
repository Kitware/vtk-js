import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkMouseManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseManipulator');

  publicAPI.startInteraction = () => {};
  publicAPI.endInteraction = () => {};
  publicAPI.onButtonDown = (interactor) => {};
  publicAPI.onButtonUp = (interactor) => {};
  publicAPI.onAnimation = (interactor, renderer) => {};
  publicAPI.onKeyUp = (interactor) => {};
  publicAPI.onKeyDown = (interactor) => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulatorName: 'goldschlager',

  button: 1,
  shift: false,
  control: false,
  alt: false,
  pinch: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'manipulatorName',
    'button',
    'shift',
    'control',
    'alt',
    'pinch',
  ]);

  // Object specific methods
  vtkMouseManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMouseManipulator');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
