import macro from 'vtk.js/Sources/macro';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLActor methods
// ----------------------------------------------------------------------------

function vtkGenericWidgetRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkGenericWidgetRepresentation');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  // Object methods
  vtkGenericWidgetRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
