import macro from 'vtk.js/Sources/macros';
import vtkLocator from 'vtk.js/Sources/Common/DataModel/Locator';

function vtkAbstractPointLocator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractPointLocator');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    bounds: null,
    numberOfBuckets: 0,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkLocator.extend(publicAPI, model, defaultValues(initialValues));

  // Make this a VTK object
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['numberOfBuckets']);

  macro.setGetArray(publicAPI, model, ['bounds'], 6);

  // Object specific methods
  vtkAbstractPointLocator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
