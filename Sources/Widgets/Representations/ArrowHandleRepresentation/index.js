import macro from 'vtk.js/Sources/macro';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkArrow2DSource from 'vtk.js/Sources/Filters/Sources/Arrow2DSource/';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/HandleRepresentation';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import { ScalarMode } from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';
import { vec3, mat3 } from 'gl-matrix';

import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

const { HandleRepresentationType } = Constants;

// ----------------------------------------------------------------------------
// vtkArrowHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkArrowHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkArrowHandleRepresentation');

  const superClass = { ...publicAPI };
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
      numberOfComponents: 9,
      empty: true,
    }),
  };
  model.internalPolyData.getPointData().addArray(model.internalArrays.scale);
  model.internalPolyData.getPointData().addArray(model.internalArrays.color);
  model.internalPolyData
    .getPointData()
    .addArray(model.internalArrays.direction);

  function detectArrowShape() {
    const representationToSource = {
      [HandleRepresentationType.STAR]: {
        initialValues: { shape: 'star' },
      },
      [HandleRepresentationType.ARROWHEAD3]: {
        initialValues: { shape: 'triangle' },
      },
      [HandleRepresentationType.ARROWHEAD4]: {
        initialValues: { shape: 'arrow4points' },
      },
      [HandleRepresentationType.ARROWHEAD6]: {
        initialValues: { shape: 'arrow6points' },
      },
    };
    return vtkArrow2DSource.newInstance(
      representationToSource[model.handleType].initialValues
    );
  }

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.displayMapper = vtkPixelSpaceCallbackMapper.newInstance();
  model.displayActor = vtkActor.newInstance();
  // model.displayActor.getProperty().setOpacity(0); // don't show in 3D
  model.displayActor.setMapper(model.displayMapper);
  model.displayMapper.setInputConnection(publicAPI.getOutputPort());
  publicAPI.addActor(model.displayActor);
  model.alwaysVisibleActors = [model.displayActor];
  model.pipelines = {
    arrow: {
      source: publicAPI,
      glyph: detectArrowShape(),
      mapper: vtkGlyph3DMapper.newInstance({
        orientationArray: 'direction',
        scaleArray: 'scale',
        colorByArrayName: 'color',
        scalarMode: ScalarMode.USE_POINT_FIELD_DATA,
      }),
      actor: vtkActor.newInstance(),
    },
  };

  model.pipelines.arrow.mapper.setOrientationModeToMatrix();
  model.pipelines.arrow.mapper.setResolveCoincidentTopology(true);

  vtkWidgetRepresentation.connectPipeline(model.pipelines.arrow);

  publicAPI.addActor(model.pipelines.arrow.actor);

  model.transform = vtkMatrixBuilder.buildFromDegree();
  model.actor = model.pipelines.arrow.actor;
  model.glyph = model.pipelines.arrow.glyph;
  // --------------------------------------------------------------------------

  publicAPI.setGlyphResolution = macro.chain(
    publicAPI.setGlyphResolution,
    (r) => model.glyph.setPhiResolution(r) && model.glyph.setThetaResolution(r)
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

  // --------------------------------------------------------------------------

  publicAPI.requestData = (inData, outData) => {
    const { points, scale, color, direction } = model.internalArrays;
    const list = publicAPI.getRepresentationStates(inData[0]);
    const totalCount = list.length;

    if (color.getNumberOfValues() !== totalCount) {
      // Need to resize dataset
      points.setData(new Float32Array(3 * totalCount), 3);
      scale.setData(new Float32Array(totalCount));
      color.setData(new Float32Array(totalCount));
      direction.setData(new Float32Array(9 * totalCount));
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

      let reorientArrowSource4 = vtkMatrixBuilder
        .buildFromDegree()
        .rotateFromDirections([1, 0, 0], [1, 0, 0]) // from X to Z
        .getMatrix();

      const right = state.getRight ? state.getRight() : [1, 0, 0];
      const up = state.getUp ? state.getUp() : [0, 1, 0];
      const dir = state.getDirection ? state.getDirection() : [0, 0, 1];
      const rotation = [...right, ...up, ...dir];

      let scale3 = state.getScale3 ? state.getScale3() : [1, 1, 1];
      scale3 = scale3.map((x) => (x === 0 ? 2 * model.defaultScale : 2 * x));

      if (model.toReorient === true)
        reorientArrowSource4 = vtkMatrixBuilder
          .buildFromDegree()
          .rotateFromDirections([0, 0, 1], model.orientation)
          .getMatrix();

      const reorientArrowSource3 = [];
      mat3.fromMat4(reorientArrowSource3, reorientArrowSource4);
      vec3.transformMat4(scale3, scale3, reorientArrowSource4);
      mat3.multiply(rotation, rotation, reorientArrowSource3);

      for (let j = 0; j < 9; j += 1) {
        typedArray.direction[i * 9 + j] = rotation[j];
      }
      const scale1 =
        (state.getScale1 ? state.getScale1() : model.defaultScale) / 2;

      let sFactor = scaleFactor;
      if (state.getVisible && !state.getVisible()) {
        sFactor = 0;
      }

      typedArray.scale[i * 3 + 0] = scale1 * sFactor * (0.002 * scale3[0]);
      typedArray.scale[i * 3 + 1] = scale1 * sFactor * (0.002 * scale3[1]);
      typedArray.scale[i * 3 + 2] = scale1 * sFactor * (0.002 * scale3[2]);
      typedArray.scale[i] =
        scaleFactor *
        (!state.isVisible || state.isVisible() ? 1 : 0) *
        (state.getScale1 ? state.getScale1() : model.defaultScale);

      if (publicAPI.getScaleInPixels()) {
        typedArray.scale[i] *= publicAPI.getPixelWorldHeightAtCoord(coord);
      }

      typedArray.color[i] =
        model.useActiveColor && isActive ? model.activeColor : state.getColor();
    }

    model.internalPolyData.modified();
    outData[0] = model.internalPolyData;
  };

  publicAPI.updateActorVisibility = (
    renderingType = RenderingTypes.FRONT_BUFFER,
    widgetVisible = true,
    ctxVisible = true,
    handleVisible = false
  ) => {
    superClass.updateActorVisibility(
      renderingType,
      widgetVisible,
      ctxVisible,
      handleVisible
    );
    if (model.fromLineWidget) {
      const visibility = model.handleVisibility;
      if (visibility === true) {
        model.displayActor.setVisibility(true);
        model.actor.setVisibility(true);
      } else {
        model.displayActor.setVisibility(false);
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  defaultScale: 1,
  orientation: [0, 0, 0],
  toReorient: false,
  handleVisibility: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkHandleRepresentation.extend(publicAPI, model, initialValues);
  macro.get(publicAPI, model, ['glyph', 'mapper', 'actor']);
  macro.setGet(publicAPI, model, ['toReorient', 'handleVisibility']);
  macro.setGetArray(publicAPI, model, ['orientation'], 3);
  // Object specific methods
  vtkArrowHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkArrowHandleRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
