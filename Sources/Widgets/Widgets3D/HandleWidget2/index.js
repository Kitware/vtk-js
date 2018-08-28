import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidgetFactory from 'vtk.js/Sources/Widgets/Core/AbstractWidgetFactory';
import vtkCircleContextRepresentation from 'vtk.js/Sources/Widgets/Representations/CircleContextRepresentation';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Widgets/Representations/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Widgets/Core/StateBuilder';

import { Type } from 'vtk.js/Sources/Widgets/Widgets3D/HandleWidget2/Constants';
import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';

// ----------------------------------------------------------------------------
// Widget linked to a view
// ----------------------------------------------------------------------------

function widgetBehavior(publicAPI, model) {
  let isDragging = null;

  publicAPI.handleLeftButtonPress = () => {
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }
    if (model.type === Type.Drag) {
      isDragging = true;
      model.interactor.requestAnimation(publicAPI);
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging || model.type === Type.MouseMove) {
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
        model.widgetState.getPlane().setOrigin(...worldCoords);
      }
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  macro.setGet(publicAPI, model, [{ name: 'type', type: 'enum', enum: Type }]);
  const parentSetType = publicAPI.setType;
  publicAPI.setType = (type) => {
    if (parentSetType(type)) {
      if (model.type === Type.Drag) {
        model.interactor.cancelAnimation(publicAPI);
      } else {
        model.interactor.requestAnimation(publicAPI);
      }
    }
    return false;
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.renderer.getActiveCamera().onModified((camera) => {
    model.manipulator.setNormal(camera.getDirectionOfProjection());
    model.widgetState
      .getPlane()
      .setDirection(camera.getDirectionOfProjection());
  });

  if (model.type === Type.MouseMove) {
    model.interactor.requestAnimation(publicAPI);
  }
}

// ----------------------------------------------------------------------------
// Factory
// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkHandleWidget');

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
          { builder: vtkCircleContextRepresentation, labels: ['plane'] },
          { builder: vtkSphereHandleRepresentation, labels: ['handle'] },
        ];
    }
  };
  // --- Widget Requirement ---------------------------------------------------

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['handle'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.9,
        origin: [0, 0, 0],
      },
    })
    .addStateFromMixin({
      labels: ['plane'],
      mixins: ['origin', 'color', 'scale1', 'direction', 'visible'],
      name: 'plane',
      initialValues: {
        scale1: 1,
        origin: [0, 0, 0],
        direction: [0, 0, 1],
        visible: false,
      },
    })
    .build();
  const handle = model.widgetState.getHandle();
  const plane = model.widgetState.getPlane();

  // Default manipulator
  model.manipulator = vtkPlaneManipulator.newInstance();
  handle.setManipulator(model.manipulator);

  // FIXME bad cleanup missing...
  handle.onModified(() => {
    plane.setOrigin(handle.getOrigin());
    plane.setVisible(handle.getActive());
  });
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
  type: Type.Drag,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidgetFactory.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'manipulator',
    { name: 'type', type: 'enum', enum: Type },
  ]);

  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
