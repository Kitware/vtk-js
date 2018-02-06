import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkMouseManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseManipulator');

  publicAPI.startInteraction = () => {};
  publicAPI.endInteraction = () => {};
  publicAPI.onButtonDown = (interactor, renderer, position) => {};
  publicAPI.onButtonUp = (interactor) => {};
  publicAPI.onMouseMove = (interactor, renderer, position) => {};
  publicAPI.onKeyUp = (interactor, key) => {};
  publicAPI.onKeyDown = (interactor, key) => {};
  publicAPI.onStartScroll = (interactor, renderer, delta) => {};
  publicAPI.onScroll = (interactor, renderer, delta) => {};
  publicAPI.onEndScroll = (interactor) => {};
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
  scroll: false,
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
    'scroll',
  ]);

  // Object specific methods
  vtkMouseManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMouseManipulator');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
