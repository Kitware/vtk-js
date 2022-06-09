import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkImplicitPlaneRepresentation from 'vtk.js/Sources/Widgets/Representations/ImplicitPlaneRepresentation';
import vtkLineManipulator from 'vtk.js/Sources/Widgets/Manipulators/LineManipulator';
import vtkTrackballManipulator from 'vtk.js/Sources/Widgets/Manipulators/TrackballManipulator';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkPlaneWidget');
  model._isDragging = false;

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.updateCursor = () => {
    switch (model.activeState.getUpdateMethodName()) {
      case 'updateFromOrigin':
        model._apiSpecificRenderWindow.setCursor('crosshair');
        break;
      case 'updateFromPlane':
        model._apiSpecificRenderWindow.setCursor('move');
        break;
      case 'updateFromNormal':
        model._apiSpecificRenderWindow.setCursor('alias');
        break;
      default:
        model._apiSpecificRenderWindow.setCursor('grabbing');
        break;
    }
  };

  publicAPI.handleLeftButtonPress = (callData) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    model.lineManipulator.setWidgetOrigin(model.widgetState.getOrigin());
    model.planeManipulator.setWidgetOrigin(model.widgetState.getOrigin());
    model.trackballManipulator.reset(callData); // setup trackball delta

    if (model.dragable) {
      model._isDragging = true;
      model._apiSpecificRenderWindow.setCursor('grabbing');
      model._interactor.requestAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (model._isDragging) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    if (model._isDragging) {
      model._interactor.cancelAnimation(publicAPI);
      model._isDragging = false;
    }

    model.widgetState.deactivate();

    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleEvent = (callData) => {
    if (model.pickable && model.activeState && model.activeState.getActive()) {
      publicAPI[model.activeState.getUpdateMethodName()](callData);
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Event coordinate translation
  // --------------------------------------------------------------------------

  publicAPI.updateFromOrigin = (callData) => {
    model.planeManipulator.setWidgetNormal(model.widgetState.getNormal());
    const worldCoords = model.planeManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (model.widgetState.containsPoint(worldCoords)) {
      model.activeState.setOrigin(worldCoords);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.updateFromPlane = (callData) => {
    // Move origin along normal axis
    model.lineManipulator.setWidgetNormal(model.activeState.getNormal());
    const worldCoords = model.lineManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (model.widgetState.containsPoint(...worldCoords)) {
      model.activeState.setOrigin(worldCoords);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.updateFromNormal = (callData) => {
    model.trackballManipulator.setWidgetNormal(model.activeState.getNormal());

    const newNormal = model.trackballManipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );
    model.activeState.setNormal(newNormal);
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.lineManipulator = vtkLineManipulator.newInstance();
  model.planeManipulator = vtkPlaneManipulator.newInstance();
  model.trackballManipulator = vtkTrackballManipulator.newInstance();
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkImplicitPlaneWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPlaneWidget');

  // --- Widget Requirement ---------------------------------------------------

  model.widgetState = vtkImplicitPlaneRepresentation.generateState();

  model.behavior = widgetBehavior;

  model.methodsToLink = [
    'representationStyle',
    'sphereResolution',
    'handleSizeRatio',
    'axisScale',
    'normalVisible',
    'originVisible',
    'planeVisible',
    'outlineVisible',
  ];

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [{ builder: vtkImplicitPlaneRepresentation }];
    }
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  vtkImplicitPlaneWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImplicitPlaneWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
