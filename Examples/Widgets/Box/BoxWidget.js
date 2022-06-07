import macro from 'vtk.js/Sources/macros';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkConvexFaceContextRepresentation from 'vtk.js/Sources/Widgets/Representations/ConvexFaceContextRepresentation';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let isDragging = null;

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.handleLeftButtonPress = () => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }
    isDragging = true;
    model._interactor.requestAnimation(publicAPI);
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.pickable) {
      model._interactor.cancelAnimation(publicAPI);
    }
    isDragging = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleEvent = (callData) => {
    if (
      model.pickable &&
      model.manipulator &&
      model.activeState &&
      model.activeState.getActive()
    ) {
      model.manipulator.setNormal(model.camera.getDirectionOfProjection());
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.apiSpecificRenderWindow
      );

      if (worldCoords.length) {
        model.activeState.setOrigin(...worldCoords);
      }
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.camera = model.renderer.getActiveCamera();

  model.classHierarchy.push('vtkBoxWidgetProp');
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkBoxWidget(publicAPI, model) {
  model.classHierarchy.push('vtkBoxWidget');

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
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['---', '--+', '-++', '-+-'],
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['---', '+--', '+-+', '--+'],
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['+--', '++-', '+++', '+-+'],
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['++-', '-+-', '-++', '+++'],
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['--+', '+-+', '+++', '-++'],
          },
          {
            builder: vtkConvexFaceContextRepresentation,
            labels: ['---', '+--', '++-', '-+-'],
          },
        ];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['handles', '---'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, -1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '-+-'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, 1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+--'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, -1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '++-'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, 1, -1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '--+'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, -1, 1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '-++'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [-1, 1, 1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+-+'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, -1, 1],
      },
    })
    .addStateFromMixin({
      labels: ['handles', '+++'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.1,
        origin: [1, 1, 1],
      },
    })
    .build();
  const handles = model.widgetState.getStatesWithLabel('handles');

  // Default manipulator
  model.manipulator = vtkPlaneManipulator.newInstance({
    useCameraNormal: true,
  });
  handles.forEach((handle) => handle.setManipulator(model.manipulator));
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

  vtkBoxWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkBoxWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
