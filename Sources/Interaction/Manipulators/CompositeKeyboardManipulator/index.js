// ----------------------------------------------------------------------------
// vtkCompositeKeyboardManipulator methods
// ----------------------------------------------------------------------------

function vtkCompositeKeyboardManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCompositeKeyboardManipulator');

  publicAPI.onKeyPress = (interactor, renderer, key) => {};
  publicAPI.onKeyDown = (interactor, renderer, key) => {};
  publicAPI.onKeyUp = (interactor, renderer, key) => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object specific methods
  vtkCompositeKeyboardManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
