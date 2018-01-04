import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkProperty2D methods
// ----------------------------------------------------------------------------

function vtkProperty2D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProperty2D');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {
  color: [1, 1, 1],
  opacity: 1,
  pointSize: 1,
  lineWidth: 1,
  displayLocation: 'Foreground',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'opacity',
    'lineWidth',
    'pointSize',
    'displayLocation',
  ]);
  macro.setGetArray(publicAPI, model, ['color'], 3);

  // Object methods
  vtkProperty2D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProperty2D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
