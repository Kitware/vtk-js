import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
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
    DEFAULT: [{ builder: vtkSphereHandleRepresentation, labels: ['handle'] }],
  };
  model.viewTypeAlias = ['DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT'];

  // Default state
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .add(['handle'], 'sphere', 'handle', {
      radius: 0.5,
      position: [0, 0, 0],
    })
    .build();

  // Default manipulator
  model.manipulator = vtkPlanePointManipulator.newInstance();

  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = () => {
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }
    if (model.type === Type.Drag) {
      isDragging = true;
      model.keepHandleControl = true;
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
    isDragging = false;
    model.keepHandleControl = false;
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
        model.activeState.setPosition(...worldCoords);
      }

      model.renderer.resetCameraClippingRange();
      model.interactor.render();

      return macro.EVENT_ABORT;
    }
    console.log('skip handle');

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
        model.manipulator.setPlaneOrigin(camera.getFocalPoint());
        model.manipulator.setPlaneNormal(camera.getDirectionOfProjection());
      });
    }
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

  vtkAbstractWidget.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['manipulator', 'type']);

  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
