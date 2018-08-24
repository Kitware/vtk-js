import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkPlaneHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/PlaneHandleRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';
import Constants from 'vtk.js/Sources/Interaction/Widgets2/HandleWidget2/Constants';

const { Type } = Constants;

// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkHandleWidget');

  let subscription = null;
  let isDragging = null;

  model.representationBuilder = {
    DEFAULT: [
      { builder: vtkPlaneHandleRepresentation, labels: ['plane'] },
      { builder: vtkSphereHandleRepresentation, labels: ['handle'] },
    ],
  };
  model.viewTypeAlias = ['DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT'];

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .addStateFromMixin({
      labels: ['handle'],
      mixins: ['origin', 'color', 'scale1', 'manipulator'],
      name: 'handle',
      initialValues: {
        scale1: 0.5,
        origin: [0, 0, 0],
      },
    })
    .addStateFromMixin({
      labels: ['plane'],
      mixins: ['origin', 'color', 'scale1', 'direction', 'visible'],
      name: 'plane',
      initialValues: {
        scale1: 2,
        origin: [0, 0, 0],
        direction: [0, 0, 1],
        visible: false,
      },
    })
    .build();
  const handle = model.widgetState.getHandle();
  const plane = model.widgetState.getPlane();

  // Default manipulator
  model.manipulator = vtkPlanePointManipulator.newInstance();
  handle.setManipulator(model.manipulator);

  // FIXME bad cleanup missing...
  handle.onModified(() => {
    plane.setOrigin(handle.getOrigin());
    plane.setVisible(handle.getActive());
  });

  // --------------------------------------------------------------------------

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
        publicAPI.getOpenGLRenderWindow()
      );

      if (worldCoords.length) {
        model.activeState.setOrigin(...worldCoords);
        model.widgetState.getPlane().setOrigin(...worldCoords);
      }

      // model.renderer.resetCameraClippingRange();

      return macro.EVENT_ABORT;
    }

    return macro.VOID;
  };

  // --------------------------------------------------------------------------

  publicAPI.setRenderer = macro.chain(publicAPI.setRenderer, (renderer) => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    if (renderer) {
      renderer.getActiveCamera().onModified((camera) => {
        model.manipulator.setNormal(camera.getDirectionOfProjection());
        model.widgetState
          .getPlane()
          .setDirection(camera.getDirectionOfProjection());
      });
    }
  });

  // --------------------------------------------------------------------------

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

  if (model.type === Type.MouseMove) {
    model.interactor.requestAnimation(publicAPI);
  }
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
  type: Type.Drag,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidget.extend(publicAPI, model, initialValues);

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
