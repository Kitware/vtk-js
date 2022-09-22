import macro from 'vtk.js/Sources/macros';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';

function vtkSphereContextRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkSphereContextRepresentation');

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    model._pipeline.glyph.setThetaResolution,
    model._pipeline.glyph.setPhiResolution
  );

  publicAPI.setDrawBorder = (draw) => {
    model._pipeline.glyph.setLines(draw);
  };
  publicAPI.setDrawFace = (draw) => {
    model._pipeline.glyph.setFace(draw);
  };
  publicAPI.setOpacity = (opacity) => {
    model._pipeline.actor.getProperty().setOpacity(opacity);
  };

  model._pipeline.actor.getProperty().setOpacity(0.2);
}

function defaultValues(initialValues) {
  return {
    glyphResolution: 32,
    drawBorder: false,
    drawFace: true,
    behavior: Behavior.CONTEXT,
    _pipeline: {
      glyph: vtkSphereSource.newInstance({
        phiResolution: initialValues.glyphResolution ?? 32,
        thetaResolution: initialValues.glyphResolution ?? 32,
      }),
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, ['glyphResolution']);

  vtkSphereContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereContextRepresentation'
);

export default { newInstance, extend };
