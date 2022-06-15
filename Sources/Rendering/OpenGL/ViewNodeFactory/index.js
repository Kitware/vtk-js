import macro from 'vtk.js/Sources/macros';
import vtkViewNodeFactory from 'vtk.js/Sources/Rendering/SceneGraph/ViewNodeFactory';

const CLASS_MAPPING = Object.create(null);

export function registerOverride(className, fn) {
  CLASS_MAPPING[className] = fn;
}

// ----------------------------------------------------------------------------
// vtkOpenGLViewNodeFactory methods
// ----------------------------------------------------------------------------

function vtkOpenGLViewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLViewNodeFactory');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    // Static class mapping shared across instances
    overrides: CLASS_MAPPING,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Inheritance
  vtkViewNodeFactory.extend(publicAPI, model, initialValues);

  // Object methods
  vtkOpenGLViewNodeFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLViewNodeFactory',
  true
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
