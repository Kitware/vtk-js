import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

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

  publicAPI.getGlyphResolution = () => model._pipeline.glyph.getPhiResolution();
  publicAPI.setGlyphResolution = (resolution) =>
    model._pipeline.glyph.setPhiResolution(resolution) ||
    model._pipeline.glyph.setThetaResolution(resolution);

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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkSphereHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkSphereHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
