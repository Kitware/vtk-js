import macro from 'vtk.js/Sources/macros';
import vtkAbstractPointLocator from 'vtk.js/Sources/Common/DataModel/AbstractPointLocator';

function vtkIncrementalPointLocator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkIncrementalPointLocator');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractPointLocator.extend(
    publicAPI,
    model,
    defaultValues(initialValues)
  );

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Object specific methods
  vtkIncrementalPointLocator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkIncrementalPointLocator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
