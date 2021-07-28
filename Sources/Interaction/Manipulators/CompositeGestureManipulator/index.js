import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkCompositeMouseManipulator methods
// ----------------------------------------------------------------------------

function vtkCompositeGestureManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCompositeGestureManipulator');

  publicAPI.startInteraction = () => {};
  publicAPI.endInteraction = () => {};

  publicAPI.onStartPinch = (interactor, scale) => {};
  publicAPI.onStartRotate = (interactor, rotation) => {};
  publicAPI.onStartPan = (interactor, translation) => {};
  publicAPI.onPinch = (interactor, renderer, scale) => {};
  publicAPI.onRotate = (interactor, renderer, rotation) => {};
  publicAPI.onPan = (interactor, renderer, translation) => {};
  publicAPI.onEndPinch = (interactor) => {};
  publicAPI.onEndRotate = (interactor) => {};
  publicAPI.onEndPan = (interactor) => {};

  publicAPI.isPinchEnabled = () => model.pinchEnabled;
  publicAPI.isPanEnabled = () => model.panEnabled;
  publicAPI.isRotateEnabled = () => model.rotateEnabled;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pinchEnabled: true,
  panEnabled: true,
  rotateEnabled: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Create get-set macros
  macro.set(publicAPI, model, ['pinchEnabled', 'panEnabled', 'rotateEnabled']);
  macro.setGet(publicAPI, model, ['interactorStyle']);

  // Object specific methods
  vtkCompositeGestureManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
