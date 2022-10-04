import macro from 'vtk.js/Sources/macros';
import vtkCircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkCircleContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkCircleContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCircleContextRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model._pipeline.actor.getProperty().setOpacity(0.2);
  model._pipeline.mapper.setResolveCoincidentTopology(true);
  model._pipeline.mapper.setRelativeCoincidentTopologyPolygonOffsetParameters(
    -1,
    -1
  );

  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    model._pipeline.glyph.setResolution
  );

  // --------------------------------------------------------------------------

  publicAPI.setDrawBorder = macro.chain(publicAPI.setDrawBorder, (draw) =>
    model._pipeline.glyph.setLines(draw)
  );

  // --------------------------------------------------------------------------

  publicAPI.setDrawFace = macro.chain(publicAPI.setDrawFace, (draw) =>
    model._pipeline.glyph.setFace(draw)
  );

  // --------------------------------------------------------------------------

  publicAPI.setOpacity = (opacity) => {
    model._pipeline.actor.getProperty().setOpacity(opacity);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    behavior: Behavior.CONTEXT,
    glyphResolution: 32,
    drawBorder: false,
    drawFace: true,
    ...initialValues,
    _pipeline: {
      glyph:
        initialValues?.pipeline?.glyph ??
        vtkCircleSource.newInstance({
          resolution: initialValues.glyphResolution ?? 32,
          radius: 1,
          lines: initialValues.drawBorder ?? false,
          face: initialValues.drawFace ?? true,
          direction: [0, 0, 1],
        }),
      ...initialValues?.pipeline,
    },
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, ['glyphResolution', 'drawFace', 'drawBorder']);
  macro.get(publicAPI, model._pipeline, ['glyph', 'mapper', 'actor']);

  // Object specific methods
  vtkCircleContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkCircleContextRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
