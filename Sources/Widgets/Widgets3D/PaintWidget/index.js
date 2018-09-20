import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkCircleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleContextRepresentation';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  publicAPI.handleLeftButtonPress = (callData) => {
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }

    model.painting = true;
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => publicAPI.handleEvent(callData);

  publicAPI.handleLeftButtonRelease = () => {
    if (model.painting) {
      publicAPI.invokeEndInteractionEvent();
      model.widgetState.clearTrailList();
    }
    model.painting = false;
  };

  publicAPI.handleEvent = (callData) => {
    if (
      model.manipulator &&
      model.activeState &&
      model.activeState.getActive()
    ) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (worldCoords.length) {
        model.widgetState.setTrueOrigin(...worldCoords);

        // offset origin for handle representation
        const dir = model.activeState.getDirection();
        vtkMath.normalize(dir);
        vtkMath.add(worldCoords, dir, worldCoords);
        model.activeState.setOrigin(...worldCoords);

        if (model.painting) {
          const trailCircle = model.widgetState.addTrail();
          trailCircle.set(
            model.activeState.get('origin', 'direction', 'scale1')
          );
        }
      }

      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      model.activeState = model.widgetState.getHandle();
      model.activeState.activate();
      model.interactor.requestAnimation(publicAPI);
    }
    model.hasFocus = true;
  };

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
    }
    model.widgetState.deactivate();
    model.widgetState.getHandle().deactivate();
    model.activeState = null;
    model.hasFocus = false;
  };

  macro.get(publicAPI, model, ['painting']);
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkPaintWidget(publicAPI, model) {
  model.classHierarchy.push('vtkPaintWidget');

  // --- Widget Requirement ---------------------------------------------------
  model.behavior = widgetBehavior;

  publicAPI.getRepresentationsForViewType = (viewType) => {
    switch (viewType) {
      case ViewTypes.DEFAULT:
      case ViewTypes.GEOMETRY:
      case ViewTypes.SLICE:
        return [
          {
            builder: vtkCircleContextRepresentation,
            labels: ['handle', 'trail'],
          },
        ];
      case ViewTypes.VOLUME:
      default:
        return [{ builder: vtkSphereHandleRepresentation, labels: ['handle'] }];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .addField({
      name: 'trueOrigin',
      initialValue: [0, 0, 0],
    })
    .addStateFromMixin({
      labels: ['handle'],
      mixins: ['origin', 'color', 'scale1', 'direction', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: model.radius * 2,
        origin: [0, 0, 0],
        direction: [0, 0, 1],
      },
    })
    .addDynamicMixinState({
      labels: ['trail'],
      mixins: ['origin', 'color', 'scale1', 'direction'],
      name: 'trail',
      initialValues: {
        scale1: model.radius * 2,
        origin: [0, 0, 0],
        direction: [0, 0, 1],
      },
    })
    .build();

  const handle = model.widgetState.getHandle();

  // Default manipulator
  model.manipulator = vtkPlaneManipulator.newInstance();
  handle.setManipulator(model.manipulator);

  // override
  const superSetRadius = publicAPI.setRadius;
  publicAPI.setRadius = (r) => {
    if (superSetRadius(r)) {
      handle.setScale1(r * 2);
    }
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
  radius: 1,
  painting: false,
  color: [1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['painting']);
  macro.setGet(publicAPI, model, ['manipulator', 'radius', 'color']);

  vtkPaintWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPaintWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
