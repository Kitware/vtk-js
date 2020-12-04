import macro from 'vtk.js/Sources/macro';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';

import { RenderingTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// vtkResliceCursorContextRepresentation methods
// ----------------------------------------------------------------------------

function vtkResliceCursorContextRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorContextRepresentation');

  // --------------------------------------------------------------------------
  // Generic rendering pipeline
  // --------------------------------------------------------------------------

  model.mapper = vtkMapper.newInstance();
  model.actor = vtkActor.newInstance();
  model.mapper.setInputConnection(publicAPI.getOutputPort());
  model.actor.setMapper(model.mapper);
  publicAPI.addActor(model.actor);

  model.pipelines = {};
  model.pipelines.center = {
    source: vtkSphereSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance(),
  };
  model.pipelines.axes = [];
  // Create axis 1
  const axis1 = {};
  axis1.line = {
    source: vtkCylinderSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ pickable: true }),
  };
  axis1.rotation1 = {
    source: vtkSphereSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ pickable: true }),
  };
  axis1.rotation2 = {
    source: vtkSphereSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ pickable: true }),
  };
  // Create axis 2
  const axis2 = {};
  axis2.line = {
    source: vtkCylinderSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ pickable: true }),
  };
  axis2.rotation1 = {
    source: vtkSphereSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ pickable: true }),
  };
  axis2.rotation2 = {
    source: vtkSphereSource.newInstance(),
    mapper: vtkMapper.newInstance(),
    actor: vtkActor.newInstance({ pickable: true }),
  };

  model.pipelines.axes.push(axis1);
  model.pipelines.axes.push(axis2);

  // Improve actors rendering
  model.pipelines.center.actor.getProperty().setAmbient(1, 1, 1);
  model.pipelines.center.actor.getProperty().setDiffuse(0, 0, 0);

  // Render it squarish
  model.pipelines.axes[0].line.source.setResolution(4);
  model.pipelines.axes[1].line.source.setResolution(4);

  model.pipelines.axes.forEach((axis) => {
    Object.values(axis).forEach((lineOrRotationHandle) => {
      vtkWidgetRepresentation.connectPipeline(lineOrRotationHandle);
      const actor = lineOrRotationHandle.actor;
      actor.getProperty().setAmbient(1, 1, 1);
      actor.getProperty().setDiffuse(0, 0, 0);
      publicAPI.addActor(actor);
    });
  });

  vtkWidgetRepresentation.connectPipeline(model.pipelines.center);
  publicAPI.addActor(model.pipelines.center.actor);

  publicAPI.setLineThickness = (lineThickness) => {
    let scaledLineThickness = lineThickness;
    if (publicAPI.getScaleInPixels()) {
      const centerCoords = model.pipelines.center.source.getCenter();
      scaledLineThickness *= publicAPI.getPixelWorldHeightAtCoord(centerCoords);
    }
    model.pipelines.axes[0].line.source.setRadius(scaledLineThickness);
    model.pipelines.axes[1].line.source.setRadius(scaledLineThickness);
  };

  publicAPI.setSphereRadius = (radius) => {
    publicAPI.setSphereRadiusOnSphere(radius, model.pipelines.center.source);
    publicAPI.setSphereRadiusOnSphere(
      radius,
      model.pipelines.axes[0].rotation1.source
    );
    publicAPI.setSphereRadiusOnSphere(
      radius,
      model.pipelines.axes[0].rotation2.source
    );
    publicAPI.setSphereRadiusOnSphere(
      radius,
      model.pipelines.axes[1].rotation1.source
    );
    publicAPI.setSphereRadiusOnSphere(
      radius,
      model.pipelines.axes[1].rotation2.source
    );
  };

  publicAPI.setSphereRadiusOnSphere = (radius, source) => {
    let scaledRadius = radius;
    if (publicAPI.getScaleInPixels()) {
      const centerCoords = source.getCenter();
      scaledRadius *= publicAPI.getPixelWorldHeightAtCoord(centerCoords);
    }
    source.setRadius(scaledRadius);
  };

  publicAPI.setSphereRadius(7);

  function updateRender(state, axis) {
    const color = state.getColor();
    axis.line.actor.getProperty().setColor(color);
    axis.rotation1.actor.getProperty().setColor(color);
    axis.rotation2.actor.getProperty().setColor(color);

    const vector = [0, 0, 0];
    vtkMath.subtract(state.getPoint2(), state.getPoint1(), vector);
    const center = [0, 0, 0];
    vtkMath.multiplyAccumulate(state.getPoint1(), vector, 0.5, center);
    axis.line.source.setCenter(center);
    const length = vtkMath.normalize(vector);
    axis.line.source.setDirection(vector);
    axis.line.source.setHeight(length);
    axis.rotation1.source.setCenter(state.getRotationPoint1());
    axis.rotation2.source.setCenter(state.getRotationPoint2());
  }

  /**
   * Returns the line actors in charge of translating the views.
   */
  publicAPI.getTranslationActors = () => {
    return [
      model.pipelines.axes[0].line.actor,
      model.pipelines.axes[1].line.actor,
    ];
  };

  publicAPI.getRotationActors = () => {
    return [
      model.pipelines.axes[0].rotation1.actor,
      model.pipelines.axes[0].rotation2.actor,
      model.pipelines.axes[1].rotation1.actor,
      model.pipelines.axes[1].rotation2.actor,
    ];
  };

  publicAPI.requestData = (inData, outData) => {
    const state = inData[0];

    const origin = state.getCenter();
    model.pipelines.center.source.setCenter(origin);

    const getAxis1 = `get${model.axis1Name}`;
    const getAxis2 = `get${model.axis2Name}`;
    const axis1State = state[getAxis1]();
    const axis2State = state[getAxis2]();

    updateRender(axis1State, model.pipelines.axes[0]);
    updateRender(axis2State, model.pipelines.axes[1]);

    publicAPI.setLineThickness(state.getLineThickness());
    publicAPI.setSphereRadius(state.getSphereRadius());

    // TODO: return meaningful polydata (e.g. appended lines)
    outData[0] = vtkPolyData.newInstance();
  };

  publicAPI.updateActorVisibility = (
    renderingType,
    wVisible,
    ctxVisible,
    hVisible
  ) => {
    const state = model.inputData[0];
    const visibility =
      renderingType === RenderingTypes.PICKING_BUFFER
        ? wVisible
        : wVisible && hVisible;

    publicAPI.getActors().forEach((actor) => {
      actor.getProperty().setOpacity(state.getOpacity());
      let actorVisibility = visibility;

      // Conditionally display rotation handles
      if (publicAPI.getRotationActors().includes(actor)) {
        actorVisibility = actorVisibility && state.getEnableRotation();
      }

      // Conditionally display center handle but always show it for picking
      if (!state.getShowCenter() && actor === model.pipelines.center.actor) {
        actorVisibility =
          actorVisibility && renderingType === RenderingTypes.PICKING_BUFFER;
      }

      actor.setVisibility(actorVisibility);

      // Conditionally pick lines
      if (publicAPI.getTranslationActors().includes(actor)) {
        actor.setPickable(state.getEnableTranslation());
      }
    });
    let lineThickness = state.getLineThickness();
    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      lineThickness = Math.max(3, lineThickness);
    }
    publicAPI.setLineThickness(lineThickness);

    let radius = state.getSphereRadius();
    if (renderingType === RenderingTypes.PICKING_BUFFER) {
      radius += 1;
    }
    publicAPI.setSphereRadius(radius);
  };

  publicAPI.getSelectedState = (prop, compositeID) => {
    const state = model.inputData[0];
    state.setActiveViewName(model.viewName);

    const getAxis1 = `get${model.axis1Name}`;
    const getAxis2 = `get${model.axis2Name}`;
    const axis1State = state[getAxis1]();
    const axis2State = state[getAxis2]();

    let activeLineState = null;
    let activeRotationPointName = '';
    let methodName = '';

    switch (prop) {
      case model.pipelines.axes[0].line.actor:
        activeLineState = axis1State;
        methodName = 'translateAxis';
        break;
      case model.pipelines.axes[1].line.actor:
        activeLineState = axis2State;
        methodName = 'translateAxis';
        break;
      case model.pipelines.axes[0].rotation1.actor:
        activeLineState = axis1State;
        activeRotationPointName = 'RotationPoint1';
        methodName = 'rotateLine';
        break;
      case model.pipelines.axes[0].rotation2.actor:
        activeLineState = axis1State;
        activeRotationPointName = 'RotationPoint2';
        methodName = 'rotateLine';
        break;
      case model.pipelines.axes[1].rotation1.actor:
        activeLineState = axis2State;
        activeRotationPointName = 'RotationPoint1';
        methodName = 'rotateLine';
        break;
      case model.pipelines.axes[1].rotation2.actor:
        activeLineState = axis2State;
        activeRotationPointName = 'RotationPoint2';
        methodName = 'rotateLine';
        break;
      default:
        methodName = 'translateCenter';
        break;
    }

    state.setActiveLineState(activeLineState);
    state.setActiveRotationPointName(activeRotationPointName);
    state.setUpdateMethodName(methodName);

    return state;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  axis1Name: '',
  axis2Name: '',
  coincidentTopologyParameters: {
    Point: {
      factor: -1.0,
      offset: -1.0,
    },
    Line: {
      factor: -1.5,
      offset: -1.5,
    },
    Polygon: {
      factor: -2.0,
      offset: -2.0,
    },
  },
  rotationEnabled: true,
  scaleInPixels: true,
  viewName: '',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object specific methods
  vtkResliceCursorContextRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkResliceCursorContextRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
