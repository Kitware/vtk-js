import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkGlyphRepresentation from 'vtk.js/Sources/Widgets/Representations/GlyphRepresentation';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import { allocateArray } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { getPixelWorldHeightAtCoord } from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import { vec3 } from 'gl-matrix';

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

  const superPublicAPI = { ...publicAPI };
  publicAPI.requestData = (inData, outData) => {
    superPublicAPI.requestData(inData, outData);
    if (!model.holeWidth) {
      return;
    }
    const internalPolyData = outData[0];

    // Duplicate points and point data
    const points = internalPolyData.getPoints();
    const dataArrays = internalPolyData.getPointData().getArrays();
    [points, ...dataArrays].forEach((array) => {
      const oldNumberOfValues = array.getNumberOfValues();
      array.resize(2 * array.getNumberOfTuples());
      const arrayData = array.getData();
      for (let i = 0; i < oldNumberOfValues; ++i) {
        arrayData[i + oldNumberOfValues] = arrayData[i];
      }
    });

    // Change the scale and origin of each line
    const states = publicAPI.getRepresentationStates(inData[0]);
    const nStates = states.length;
    const scaleArray = internalPolyData.getPointData().getArrayByName('scale');
    const orientationArray = internalPolyData
      .getPointData()
      .getArrayByName('orientation');
    const defaultScale = [1, 1, 1];
    const defaultOrientation = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    for (let i = 0; i < nStates; ++i) {
      const j = i + nStates;
      const scale = scaleArray?.getTuple(i) ?? defaultScale;
      const orientationMatrix =
        orientationArray?.getTuple(i) ?? defaultOrientation;
      const originalPoint = points.getTuple(i);

      // Divide the scale by two in the direction of the cylinder, as we duplicate the line
      scale[2] *= 0.5;
      scaleArray?.setTuple(i, scale);
      scaleArray?.setTuple(j, scale);

      // Add or subtract an offset to each point depending on the hole width
      let holeWidth = model.holeWidth;
      if (publicAPI.getScaleInPixels()) {
        holeWidth *= getPixelWorldHeightAtCoord(
          originalPoint,
          model.displayScaleParams
        );
      }
      const offset = vec3.fromValues(0, 0, 0.5 * scale[2] + holeWidth);
      vec3.transformMat3(offset, offset, orientationMatrix);
      points.setTuple(i, vec3.add(vec3.create(), originalPoint, offset));
      points.setTuple(j, vec3.sub(vec3.create(), originalPoint, offset));
    }
  };

  publicAPI.getSelectedState = (prop, compositeID) => {
    const representationStates = publicAPI.getRepresentationStates();
    return representationStates[compositeID % representationStates.length];
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
    holeWidth: 0,
    _pipeline: {
      glyph: vtkCylinderSource.newInstance({
        resolution: initialValues.glyphResolution ?? 4,
        initAngle: initialValues.glyphAngle ?? Math.PI / 4,
        direction: [0, 0, 1],
      }),
    },
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkGlyphRepresentation.extend(publicAPI, model, defaultValues(initialValues));
  macro.setGet(publicAPI, model, [
    'infiniteLine',
    'glyphResolution',
    'holeWidth',
  ]);

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
