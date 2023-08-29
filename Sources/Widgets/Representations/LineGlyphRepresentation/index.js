import macro from '@kitware/vtk.js/macros';
import * as vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkGlyph3DMapper from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper';
import vtkGlyphRepresentation from '@kitware/vtk.js/Widgets/Representations/GlyphRepresentation';
import { Behavior } from '@kitware/vtk.js/Widgets/Representations/WidgetRepresentation/Constants';
import { allocateArray } from '@kitware/vtk.js/Widgets/Representations/WidgetRepresentation';
import vtkCylinderSource from '@kitware/vtk.js/Filters/Sources/CylinderSource';
import { OrientationModes } from '@kitware/vtk.js/Rendering/Core/Glyph3DMapper/Constants';
import { getPixelWorldHeightAtCoord } from '@kitware/vtk.js/Widgets/Core/WidgetManager';

function vtkLineGlyphRepresentation(publicAPI, model) {
  model.classHierarchy.push('vtkLineGlyphRepresentation');

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    model._pipeline.glyph.setResolution
  );
}

function cylinderScale(publicAPI, model) {
  return (polyData, states) => {
    model._pipeline.mapper.setScaleArray('scale');
    model._pipeline.mapper.setScaleFactor(1);
    model._pipeline.mapper.setScaling(true);
    model._pipeline.mapper.setScaleMode(
      vtkGlyph3DMapper.ScaleModes.SCALE_BY_COMPONENTS
    );
    const scales = allocateArray(
      polyData,
      'scale',
      states.length,
      'Float32Array',
      3
    ).getData();
    let j = 0;
    for (let i = 0; i < states.length; ++i) {
      const state = states[i];
      const origin = state.getOrigin();
      const nextOrigin =
        states[i === states.length - 1 ? 0 : i + 1].getOrigin();

      const direction = vtkMath.subtract(nextOrigin, origin, []);
      const length = vtkMath.normalize(direction);

      let scaleFactor = state.getActive() ? model.activeScaleFactor : 1;
      if (publicAPI.getScaleInPixels()) {
        scaleFactor *= getPixelWorldHeightAtCoord(
          state.getOrigin(),
          model.displayScaleParams
        );
      }
      if (!model.forceLineThickness) {
        scaleFactor *= state.getScale1?.() ?? 1;
      }
      const scale = [1, model.lineThickness, model.lineThickness];
      scales[j++] = length * scale[0];
      scales[j++] = scaleFactor * scale[1];
      scales[j++] = scaleFactor * scale[2];
    }
  };
}

function cylinderDirection(publicAPI, model) {
  return (polyData, states) => {
    model._pipeline.mapper.setOrientationArray('orientation');
    model._pipeline.mapper.setOrientationMode(OrientationModes.MATRIX);
    const orientation = allocateArray(
      polyData,
      'orientation',
      states.length,
      'Float32Array',
      9
    ).getData();
    for (let i = 0; i < states.length; ++i) {
      const state = states[i];
      const origin = state.getOrigin();
      const nextOrigin =
        states[i === states.length - 1 ? 0 : i + 1].getOrigin();

      const direction = vtkMath.subtract(nextOrigin, origin, []);
      vtkMath.normalize(direction);
      const right = [1, 0, 0];
      const up = [0, 1, 0];
      vtkMath.perpendiculars(direction, up, right, 0);

      orientation.set(direction, 9 * i);
      orientation.set(up, 9 * i + 3);
      orientation.set(right, 9 * i + 6);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(publicAPI, model, initialValues) {
  return {
    behavior: Behavior.CONTEXT,
    glyphResolution: 32,
    lineThickness: 0.5, // radius of the cylinder
    forceLineThickness: false,
    ...initialValues,
    _pipeline: {
      glyph:
        initialValues?.pipeline?.glyph ??
        vtkCylinderSource.newInstance({
          direction: [1, 0, 0],
          center: [0.5, 0, 0], // origin of cylinder at end, not center
          capping: false,
        }),
      ...initialValues?.pipeline,
    },
    applyMixin: {
      noScale: cylinderScale(publicAPI, model),
      scale1: cylinderScale(publicAPI, model),
      noOrientation: cylinderDirection(publicAPI, model),
    },
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(
    publicAPI,
    model,
    defaultValues(publicAPI, model, initialValues)
  );
  macro.setGet(publicAPI, model, [
    'glyphResolution',
    'lineThickness',
    'forceLineThickness',
  ]);
  macro.get(publicAPI, model._pipeline, ['glyph', 'mapper', 'actor']);

  vtkLineGlyphRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkLineGlyphRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
