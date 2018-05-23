import macro from 'vtk.js/Sources/macro';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';
import vtkStateObserver from 'vtk.js/Sources/Interaction/Widgets2/StateObserver';

function vtkAbstractRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractRepresentation');

  // --------------------------------------------------------------------------

  // Virtual method
  // Should return a vtkPicker
  publicAPI.getEventIntersection = (event) => {};

  // --------------------------------------------------------------------------

  // Virtual method
  publicAPI.getBounds = () => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  renderer: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['renderer']);

  // mixin
  vtkStateObserver(publicAPI, model);

  // Object methods
  vtkAbstractRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkAbstractRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
