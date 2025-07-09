import macro from 'vtk.js/Sources/macros';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';

import vtkTransformHandleSource from 'vtk.js/Sources/Widgets/Representations/TranslateTransformHandleRepresentation/TransformHandleSource';

// ----------------------------------------------------------------------------
// vtkScaleTransformHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkScaleTransformHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkScaleTransformHandleRepresentation');
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

  const cube1 = vtkCubeSource.newInstance(initialValues.cubeSource);
  const cube2 = vtkCubeSource.newInstance(initialValues.cubeSource);

  source.addInputConnection(cube1.getOutputPort());
  source.addInputConnection(cube2.getOutputPort());

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
  vtkScaleTransformHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkScaleTransformHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
