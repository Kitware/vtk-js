import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidgetFactory';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlaneRepresentation from 'vtk.js/Sources/Interaction/Widgets2/PlaneRepresentation';

import { ViewTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let isDragging = null;

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.handleLeftButtonPress = () => {
    if (!model.activeState || !model.activeState.getActive() || !model.active) {
      return macro.VOID;
    }
    isDragging = true;
    model.interactor.requestAnimation(publicAPI);
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.active) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.active) {
      model.interactor.cancelAnimation(publicAPI);
    }
    isDragging = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleEvent = (callData) => {
    if (model.active && model.activeState && model.activeState.getActive()) {
      const manipulator = model.activeState.getManipulator();
      const bounds = model.activeState.getBounds();
      if (model.activeState.getUseCameraForManipulator()) {
        // FIXME should be lineManipulator not plane in that case
        manipulator.setNormal(model.camera.getDirectionOfProjection());
      }
      const worldCoords = manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (worldCoords.length) {
        model.activeState.setOrigin(
          vtkMath.clampValue(worldCoords[0], bounds[0], bounds[1]),
          vtkMath.clampValue(worldCoords[1], bounds[2], bounds[3]),
          vtkMath.clampValue(worldCoords[2], bounds[4], bounds[5])
        );
      }
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.camera = model.renderer.getActiveCamera();
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkPlaneWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPlaneWidget');

  // --- Widget Requirement ---------------------------------------------------
  model.behavior = widgetBehavior;

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [{ builder: vtkPlaneRepresentation }];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  // Default state
  model.widgetState = vtkPlaneRepresentation.generateState();
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  vtkPlaneWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlaneWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
