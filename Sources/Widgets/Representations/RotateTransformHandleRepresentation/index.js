import macro from 'vtk.js/Sources/macros';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkTorusSource from 'vtk.js/Sources/Filters/Sources/TorusSource';

// ----------------------------------------------------------------------------
// vtkRotateTransformHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkRotateTransformHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRotateTransformHandleRepresentation');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
function defaultValues(initialValues) {
  return {
    _pipeline: {
      glyph: vtkTorusSource.newInstance({}),
    },
    ...initialValues,
  };
}

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));

  // Object specific methods
  vtkRotateTransformHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkRotateTransformHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
