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

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Each factory inherits the shared OpenGL mappings while still allowing
  // instance-local overrides such as vtkSharedRenderer.
  model.overrides = Object.create(CLASS_MAPPING);

  // Inheritance
  vtkViewNodeFactory.extend(publicAPI, model, initialValues);

  publicAPI.registerOverride = (className, fn) => {
    model.overrides[className] = fn;
  };

  // Object methods
  vtkOpenGLViewNodeFactory(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLViewNodeFactory'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
