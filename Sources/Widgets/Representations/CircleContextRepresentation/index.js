import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCircleSource from 'vtk.js/Sources/Filters/Sources/CircleSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

// ----------------------------------------------------------------------------
// vtkCircleContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkCircleContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCircleContextRepresentation');

  // --------------------------------------------------------------------------
  // Internal polydata dataset
  // --------------------------------------------------------------------------

  model.internalPolyData = vtkPolyData.newInstance({ mtime: 0 });
  model.internalArrays = {
    points: model.internalPolyData.getPoints(),
    scale: vtkDataArray.newInstance({
      name: 'scale',
      numberOfComponents: 1,
      empty: true,
    }),
    color: vtkDataArray.newInstance({
      name: 'color',
      numberOfComponents: 1,
      empty: true,
    }),
    direction: vtkDataArray.newInstance({
      name: 'direction',
      numberOfComponents: 3,
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

  model.pipelines = {
    circle: {
      source: publicAPI,
      glyph: vtkCircleSource.newInstance({
        resolution: model.glyphResolution,
        radius: 1,
      }),
      mapper: vtkGlyph3DMapper.newInstance({
        orientationArray: 'direction',
        scaleArray: 'scale',
        colorByArrayName: 'color',
        scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
      }),
      actor: vtkActor.newInstance({ pickable: false }),
    },
  };

  model.pipelines.circle.actor.getProperty().setOpacity(0.2);
  model.pipelines.circle.mapper.setOrientationModeToDirection();

  vtkWidgetRepresentation.connectPipeline(model.pipelines.circle);

  model.actors.push(model.pipelines.circle.actor);

  model.tranform = vtkMatrixBuilder.buildFromDegree();

  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model.glyph.setResolution(r)
  );

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const { points, scale, color, direction } = model.internalArrays;
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount));
      scale.setData(new Float32Array(3 * totalCount));
      direction.setData(new Float32Array(3 * totalCount));
      color.setData(new Float32Array(totalCount));
    }
    const typedArray = {
      points: points.getData(),
      scale: scale.getData(),
      color: color.getData(),
      direction: direction.getData(),
    };

    for (let i = 0; i < list.length; i++) {
      const state = list[i];
      const isActive = state.getActive();
      const scaleFactor = isActive ? model.activeScaleFactor : 1;

      const coord = state.getOrigin();
      typedArray.points[i * 3 + 0] = coord[0];
      typedArray.points[i * 3 + 1] = coord[1];
      typedArray.points[i * 3 + 2] = coord[2];

      const orient = state.getDirection() || model.defaultDirection;
      typedArray.direction[i * 3 + 0] = orient[0];
      typedArray.direction[i * 3 + 1] = orient[1];
      typedArray.direction[i * 3 + 2] = orient[2];

      const scale1 =
        (state.getScale1 ? state.getScale1() : model.defaultScale) / 2;

      let sFactor = scaleFactor;
      if (state.getVisible && !state.getVisible()) {
        sFactor = 0;
      }

      typedArray.scale[i * 3] = scale1 * sFactor;

      typedArray.color[i] =
        model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  publicAPI.setActiveScaleFactor(1);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  glyphResolution: 32,
  defaultScale: 1,
  defaultDirection: [0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['glyphResolution', 'defaultScale']);
  macro.setGetArray(publicAPI, model, ['defaultDirection']);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);

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
