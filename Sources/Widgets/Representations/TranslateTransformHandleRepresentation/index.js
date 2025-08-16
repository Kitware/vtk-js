import macro from 'vtk.js/Sources/macros';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';

import vtkTransformHandleSource from './TransformHandleSource';

// ----------------------------------------------------------------------------
// vtkTranslateTransformHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkTranslateTransformHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTranslateTransformHandleRepresentation');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
function defaultValues(initialValues) {
  const source = vtkTransformHandleSource.newInstance({
    height: initialValues.height ?? 1,
    radius: initialValues.radius ?? 1,
    resolution: initialValues.glyphResolution ?? 12,
    direction: [0, 0, 1],
  });

  const cone1 = vtkConeSource.newInstance(initialValues.coneSource);
  const cone2 = vtkConeSource.newInstance(initialValues.coneSource);

  source.addInputConnection(cone1.getOutputPort());
  source.addInputConnection(cone2.getOutputPort());

  return {
    _pipeline: {
      glyph: source,
    },
    ...initialValues,
  };
}

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));

  // Object specific methods
  vtkTranslateTransformHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkTranslateTransformHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
