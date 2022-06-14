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
  return { ...initialValues };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Static class mapping shared across instances
  initialValues.overrides = CLASS_MAPPING;

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
