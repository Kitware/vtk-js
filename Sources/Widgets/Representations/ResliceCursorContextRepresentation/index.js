import macro from 'vtk.js/Sources/macro';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
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
    source: vtkLineSource.newInstance(),
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
    source: vtkLineSource.newInstance(),
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

  vtkWidgetRepresentation.connectPipeline(model.pipelines.center);
  publicAPI.addActor(model.pipelines.center.actor);

  model.pipelines.axes.forEach((axis) => {
    Object.values(axis).forEach((lineOrRotationHandle) => {
      vtkWidgetRepresentation.connectPipeline(lineOrRotationHandle);
      const actor = lineOrRotationHandle.actor;
      actor.getProperty().setAmbient(1, 1, 1);
      actor.getProperty().setDiffuse(0, 0, 0);
      publicAPI.addActor(actor);
    });
  });

  publicAPI.setSphereRadius = (radius) => {
    model.pipelines.center.source.setRadius(radius);
    model.pipelines.axes[0].rotation1.source.setRadius(radius);
    model.pipelines.axes[0].rotation2.source.setRadius(radius);
    model.pipelines.axes[1].rotation1.source.setRadius(radius);
    model.pipelines.axes[1].rotation2.source.setRadius(radius);
  };

  publicAPI.setSphereRadius(0.05);

  function updateRender(state, axis) {
    const color = state.getColor();
    axis.line.actor.getProperty().setColor(color);
    axis.rotation1.actor.getProperty().setColor(color);
    axis.rotation2.actor.getProperty().setColor(color);

    axis.line.source.setPoint1(state.getPoint1());
    axis.line.source.setPoint2(state.getPoint2());
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
  rotationEnabled: true,
  viewName: '',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

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
