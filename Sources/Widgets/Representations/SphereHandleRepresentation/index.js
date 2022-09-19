import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import vtkWidgetRepresentation, {
  getPixelWorldHeightAtCoord,
} from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

// ----------------------------------------------------------------------------
// vtkSphereHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkSphereHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphereHandleRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

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

  vtkWidgetRepresentation.connectPipeline(model.pipelines.sphere);
  publicAPI.addActor(model.pipelines.sphere.actor);

  // --------------------------------------------------------------------------

  publicAPI.getGlyphResolution = () =>
    model.pipelines.sphere.glyph.getPhiResolution();
  publicAPI.setGlyphResolution = (resolution) =>
    model.pipelines.sphere.glyph.setPhiResolution(resolution) ||
    model.pipelines.sphere.glyph.setThetaResolution(resolution);

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

  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    const points = publicAPI
      .allocateArray('points', 'Float32Array', 3, totalCount)
      .getData();

    const color = publicAPI
      .allocateArray('color', ...publicAPI.computeColorType(list), totalCount)
      .getData();
    const scale = publicAPI
      .allocateArray('scale', 'Float32Array', 1, totalCount)
      .getData();

    for (let i = 0; i < totalCount; i++) {
      const state = list[i];
      const isActive = state.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      points[i * 3 + 0] = coord[0];
      points[i * 3 + 1] = coord[1];
      points[i * 3 + 2] = coord[2];

      scale[i] =
        scaleFactor *
        (state.getScale1 ? state.getScale1() : model.defaultScale);

      if (publicAPI.getScaleInPixels()) {
        scale[i] *= getPixelWorldHeightAtCoord(coord, model.displayScaleParams);
      }

      publicAPI.colorize(color, i, state);
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(publicAPI, initialValues) {
  return {
    defaultScale: 1,
    pipelines: {
      sphere: {
        source: publicAPI,
        glyph: vtkSphereSource.newInstance({
          phiResolution: 8,
          thetaResolution: 8,
        }),
        mapper: vtkGlyph3DMapper.newInstance({
          scaleArray: 'scale',
          colorByArrayName: 'color',
          scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
        }),
        actor: vtkActor.newInstance({ parentProp: publicAPI }),
      },
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkHandleRepresentation.extend(
    publicAPI,
    model,
    defaultValues(publicAPI, initialValues)
  );
  macro.get(publicAPI, model.pipelines.sphere, ['glyph', 'mapper', 'actor']);

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
