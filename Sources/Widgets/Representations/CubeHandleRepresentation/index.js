import macro from 'vtk.js/Sources/macros';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';

// ----------------------------------------------------------------------------
// vtkCubeHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkCubeHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCubeHandleRepresentation');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
function defaultValues(initialValues) {
  return {
    _pipeline: {
      glyph: vtkCubeSource.newInstance(),
    },
    ...initialValues,
  };
}

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));

  // Object specific methods
  vtkCubeHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkCubeHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
