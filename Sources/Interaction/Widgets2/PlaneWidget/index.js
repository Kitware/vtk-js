import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidgetFactory';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlaneRepresentation from 'vtk.js/Sources/Interaction/Widgets2/PlaneRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';

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
    model.manipulator.setOrigin(model.widgetState.getOrigin());
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
      publicAPI[model.activeState.getUpdateMethodName()](callData);
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.updateFromOrigin = (callData) => {
    const bounds = model.activeState.getBounds();
    model.manipulator.setNormal(model.widgetState.getNormal());
    const worldCoords = model.manipulator.handleEvent(
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
  };

  publicAPI.updateFromPlane = (callData) => {
    // Move origin along normal axis
    // FIXME currently on camera plane
    const bounds = model.activeState.getBounds();
    model.manipulator.setNormal(model.camera.getDirectionOfProjection());
    const worldCoords = model.manipulator.handleEvent(
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
  };

  publicAPI.updateFromNormal = (callData) => {
    // Move origin along normal axis
    // FIXME currently on camera plane
    const origin = model.activeState.getOrigin();
    const originalNormal = model.activeState.getNormal();
    const newNormal = [0, 0, 0];
    vtkMath.cross(
      originalNormal,
      model.camera.getDirectionOfProjection(),
      newNormal
    );
    vtkMath.cross(originalNormal, newNormal, newNormal);
    model.manipulator.setNormal(newNormal);
    const worldCoords = model.manipulator.handleEvent(
      callData,
      model.openGLRenderWindow
    );

    if (worldCoords.length) {
      const normal = [
        worldCoords[0] - origin[0],
        worldCoords[1] - origin[1],
        worldCoords[2] - origin[2],
      ];
      vtkMath.normalize(normal);

      console.log(model.activeState.getNormal(), normal);
      model.activeState.setNormal(normal);
    }
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.camera = model.renderer.getActiveCamera();
  model.manipulator = vtkPlanePointManipulator.newInstance();
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
