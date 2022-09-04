import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import { OrientationModes } from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper/Constants';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import { getPixelWorldHeightAtCoord } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

// ----------------------------------------------------------------------------
// vtkLineHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkLineHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineHandleRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 3,
      empty: true,
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true,
    }),
    direction: vtkDataArray.newInstance({
      name: 'direction',
      numberOfComponents: 9,
      empty: true,
    }),
  };

  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);
  model.internalPolyData
    .getPointData()
    .addArray(model.internalArrays.direction);

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

  model.mapper = vtkGlyph3DMapper.newInstance({
    scaleArray: 'scale',
    scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_COMPONENTS,
    colorByArrayName: 'color',
    orientationArray: 'direction',
    scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
    orientationMode: OrientationModes.MATRIX,
  });
  model.actor = vtkActor.newInstance({ parentProp: publicAPI });
  model.glyph = vtkCylinderSource.newInstance({
    resolution: model.glyphResolution,
    direction: [0, 0, 1],
  });

  model.mapper.setInputConnection(publicAPI.getOutputPort(), 0);
  model.mapper.setInputConnection(model.glyph.getOutputPort(), 1);
  model.actor.setMapper(model.mapper);

  publicAPI.addActor(model.actor);

  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model.glyph.setResolution(r)
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

  const superGetRepresentationStates = publicAPI.getRepresentationStates;
  publicAPI.getRepresentationStates = (input = model.inputData[0]) =>
    superGetRepresentationStates(input).filter(
      (state) => state.getOrigin?.() && state.isVisible?.()
    );

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const { points, scale, color, direction } = model.internalArrays;
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float64Array(3 * totalCount), 3);
      scale.setData(new Float32Array(3 * totalCount), 3);
      color.setData(new Float32Array(totalCount));
      direction.setData(new Float32Array(9 * totalCount), 9);
    }
    const typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData(),
      direction: direction.getData(),
    };

    for (let i = 0; i < totalCount; i++) {
      const state = list[i];
      const isActive = state.getActive();
      let scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      typedArray.points[i * 3 + 0] = coord[0];
      typedArray.points[i * 3 + 1] = coord[1];
      typedArray.points[i * 3 + 2] = coord[2];

      const right = state.getRight ? state.getRight() : [1, 0, 0];
      const up = state.getUp ? state.getUp() : [0, 1, 0];
      const dir = state.getDirection ? state.getDirection() : [0, 0, 1];
      const rotation = [...right, ...up, ...dir];
      typedArray.direction.set(rotation, 9 * i);

      let scale3 = state.getScale3 ? state.getScale3() : [1, 1, 1];
      scale3 = scale3.map((x) => (x === 0 ? model.defaultScale : x));
      if (model.infiniteLine) {
        scale3[2] = 100000;
      }

      const scale1 = state.getScale1 ? state.getScale1() : model.defaultScale;
      if (publicAPI.getScaleInPixels()) {
        scaleFactor *= getPixelWorldHeightAtCoord(
          coord,
          model.displayScaleParams
        );
      }

      typedArray.scale[i * 3 + 0] = scale1 * scaleFactor * scale3[0];
      typedArray.scale[i * 3 + 1] = scale1 * scaleFactor * scale3[1];
      typedArray.scale[i * 3 + 2] = scale1 * scaleFactor * scale3[2];

      typedArray.color[i] =
        model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  glyphResolution: 8,
  defaultScale: 1,
  useActiveColor: true,
  infiniteLine: true,
};
let id = 0;

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  model.id = id++;

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);

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
