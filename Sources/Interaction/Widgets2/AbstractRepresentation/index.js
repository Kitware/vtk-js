import macro from 'vtk.js/Sources/macro';
import vtkProp from 'vtk.js/Sources/Rendering/Core/Prop';
import vtkStateObserver from 'vtk.js/Sources/Interaction/Widgets2/StateObserver';

function vtkAbstractRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractRepresentation');

  // --------------------------------------------------------------------------

  // Virtual method
  publicAPI.getEventIntersection = (event) => {};

  // --------------------------------------------------------------------------

  // Virtual method
  publicAPI.getBounds = () => {};
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkProp.extend(publicAPI, model, initialValues);

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
