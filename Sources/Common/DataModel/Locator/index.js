import macro from 'vtk.js/Sources/macros';

function vtkLocator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLocator');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  dataSet: null,
  maxLevel: 8, // TODO: clamp 0, Number.MAX_VALUE
  level: 8,
  automatic: false,
  tolerance: 0.0, // TODO: clamp 0.0, Number.MAX_VALUE
  useExistingSearchStructure: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['level']);

  macro.setGet(publicAPI, model, [
    'dataSet',
    'maxLevel',
    'automatic',
    'tolerance',
    'useExistingSearchStructure',
  ]);

  // Object specific methods
  vtkLocator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
