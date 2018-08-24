import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidgetFactory';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkQuadContextRepresentation from 'vtk.js/Sources/Interaction/Widgets2/QuadContextRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';
import { ViewTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let isDragging = null;

  publicAPI.handleLeftButtonPress = () => {
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }
    isDragging = true;
    model.interactor.requestAnimation(publicAPI);
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging) {
      model.interactor.cancelAnimation(publicAPI);
    }
    isDragging = false;
    model.widgetState.deactivate();
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
        model.activeState.setOrigin(...worldCoords);
      }
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.renderer.getActiveCamera().onModified((camera) => {
    model.manipulator.setNormal(camera.getDirectionOfProjection());
  });
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
          {
            builder: vtkQuadContextRepresentation,
            labels: ['---', '--+', '-++', '-+-'],
          },
          {
            builder: vtkQuadContextRepresentation,
            labels: ['---', '+--', '+-+', '--+'],
          },
          {
            builder: vtkQuadContextRepresentation,
            labels: ['+--', '++-', '+++', '+-+'],
          },
          {
            builder: vtkQuadContextRepresentation,
            labels: ['++-', '-+-', '-++', '+++'],
          },
          {
            builder: vtkQuadContextRepresentation,
            labels: ['--+', '+-+', '+++', '-++'],
          },
          {
            builder: vtkQuadContextRepresentation,
            labels: ['---', '+--', '++-', '-+-'],
          },
          { builder: vtkSphereHandleRepresentation, labels: ['handles'] },
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
  model.manipulator = vtkPlanePointManipulator.newInstance();
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
