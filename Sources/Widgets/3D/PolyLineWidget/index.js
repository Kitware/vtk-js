import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidgetFactory';
import vtkPolyLineRepresentation from 'vtk.js/Sources/Interaction/Widgets2/PolyLineRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';

import { ViewTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let isDragging = null;

  publicAPI.placeWidget = (bounds) => {
    model.widgetState.setBounds(bounds);
    const center = [
      (bounds[0] + bounds[1]) * 0.5,
      (bounds[2] + bounds[3]) * 0.5,
      (bounds[4] + bounds[5]) * 0.5,
    ];
    model.widgetState.getMoveHandle().setOrigin(center);
  };

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  publicAPI.handleLeftButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.active ||
      ignoreKey(e)
    ) {
      return macro.VOID;
    }

    if (model.activeState === model.widgetState.getMoveHandle()) {
      // Commit handle to location
      const moveHandle = model.widgetState.getMoveHandle();
      const newHandle = model.widgetState.addHandle();
      newHandle.setOrigin(...moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
    } else {
      isDragging = true;
      model.interactor.requestAnimation(publicAPI);
    }

    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (
      model.active &&
      model.manipulator &&
      model.activeState &&
      model.activeState.getActive() &&
      !ignoreKey(callData)
    ) {
      model.manipulator.setOrigin(model.activeState.getOrigin());
      model.manipulator.setNormal(model.camera.getDirectionOfProjection());
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (
        model.activeState === model.widgetState.getMoveHandle() ||
        isDragging
      ) {
        model.activeState.setOrigin(worldCoords);
        return macro.EVENT_ABORT;
      }
    }
    if (model.hasFocus) {
      model.widgetManager.disablePicking();
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.active) {
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }

    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      model.widgetManager.enablePicking();
      model.interactor.render();
    }

    isDragging = false;
  };

  publicAPI.handleKeyDown = ({ key }) => {
    if (key === 'Escape') {
      publicAPI.loseFocus();
    }
  };

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.activate();
      model.activeState.setVisible(true);
      model.interactor.requestAnimation(publicAPI);
    }
    model.hasFocus = true;
  };

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
    }
    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.widgetState.getMoveHandle().setVisible(false);
    model.activeState = null;
    model.hasFocus = false;
    model.widgetManager.enablePicking();
    model.interactor.render();
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.camera = model.renderer.getActiveCamera();
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkPolyLineWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineWidget');

  // --- Widget Requirement ---------------------------------------------------
  model.behavior = widgetBehavior;

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
      case ViewTypes.VOLUME:
      default:
        return [
          { builder: vtkSphereHandleRepresentation, labels: ['handles'] },
          { builder: vtkSphereHandleRepresentation, labels: ['moveHandle'] },
          {
            builder: vtkPolyLineRepresentation,
            labels: ['handles', 'moveHandle'],
          },
        ];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['moveHandle'],
      mixins: ['origin', 'color', 'scale1', 'visible'],
      name: 'moveHandle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, -1, -1],
        visible: false,
      },
    })
    .addDynamicMixinState({
      labels: ['handles'],
      mixins: ['origin', 'color', 'scale1'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, -1, -1],
      },
    })
    .build('bounds');

  // Default manipulator
  model.manipulator = vtkPlanePointManipulator.newInstance();

  publicAPI.placeWidget = (bounds) => {
    model.widgetState.setBounds(bounds);
    const center = [
      (bounds[0] + bounds[1]) * 0.5,
      (bounds[2] + bounds[3]) * 0.5,
      (bounds[4] + bounds[5]) * 0.5,
    ];
    model.widgetState.getMoveHandle().setOrigin(center);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['manipulator']);

  vtkPolyLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
