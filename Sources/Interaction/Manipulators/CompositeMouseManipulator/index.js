import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkCompositeMouseManipulator methods
// ----------------------------------------------------------------------------

function vtkCompositeMouseManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCompositeMouseManipulator');

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

  publicAPI.isDragEnabled = () => model.dragEnabled;
  publicAPI.isScrollEnabled = () => model.scrollEnabled;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  button: 1,
  shift: false,
  control: false,
  alt: false,
  dragEnabled: true,
  scrollEnabled: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['button', 'shift', 'control', 'alt']);
  macro.set(publicAPI, model, ['dragEnabled', 'scrollEnabled']);

  // Object specific methods
  vtkCompositeMouseManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
