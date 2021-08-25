import macro from 'vtk.js/Sources/macros';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// vtkStickMapper methods
// ----------------------------------------------------------------------------

function vtkStickMapper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkStickMapper');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  scaleArray: null,
  orientationArray: null,
  radius: 0.025,
  length: 0.1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'scaleArray',
    'orientationArray',
    'radius',
    'length',
  ]);

  // Object methods
  vtkStickMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkStickMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
