import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import { allocateArray } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

const INFINITE_RATIO = 100000;

// ----------------------------------------------------------------------------
// vtkLineHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkLineHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineHandleRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  /*
   * displayActors and displayMappers are used to render objects in HTML, allowing objects
   * to be 'rendered' internally in a VTK scene without being visible on the final output
   */

  model.displayMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.displayActor = vtkActor.newInstance({ parentProp: publicAPI });
  // model.displayActor.getProperty().setOpacity(0); // don't show in 3D
  model.displayActor.setMapper(model.displayMapper);
  model.displayMapper.setInputConnection(publicAPI.getOutputPort());
  publicAPI.addActor(model.displayActor);
  model.alwaysVisibleActors = [model.displayActor];

  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    model._pipeline.glyph.setThetaResolution,
    model._pipeline.glyph.setPhiResolution
  );

  // --------------------------------------------------------------------------

  function callbackProxy(coords) {
    if (model.displayCallback) {
      const filteredList = [];
      const states = publicAPI.getRepresentationStates();
      for (let i = 0; i < states.length; i++) {
        if (states[i].getActive()) {
          filteredList.push(coords[i]);
        }
      }
      if (filteredList.length) {
        model.displayCallback(filteredList);
        return;
      }
    }
    model.displayCallback();
  }

  publicAPI.setDisplayCallback = (callback) => {
    model.displayCallback = callback;
    model.displayMapper.setCallback(callback ? callbackProxy : null);
  };

  /**
   * Overwrite scale3 to optionally make lines infinite
   */
  const superScale3 = publicAPI.getScale3();
  publicAPI.setScale3((polyData, states) => {
    superScale3(polyData, states);
    if (model.infiniteLine) {
      const scales = allocateArray(
        polyData,
        'scale',
        states.length,
        'Float32Array',
        3
      ).getData();
      for (let i = 0; i < states.length; ++i) {
        scales[3 * i + 2] = INFINITE_RATIO;
      }
    }
  });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    infiniteLine: true,
    glyphResolution: 4,
    _pipeline: {
      glyph: vtkCylinderSource.newInstance({
        resolution: initialValues.glyphResolution ?? 4,
        direction: [0, 0, 1],
      }),
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, ['infiniteLine', 'glyphResolution']);

  // Object specific methods
  vtkLineHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkLineHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
