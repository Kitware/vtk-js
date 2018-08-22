import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkPlanePointManipulator from 'vtk.js/Sources/Interaction/Widgets2/PlanePointManipulator';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';

// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkHandleWidget');

  let subscription = null;

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

  publicAPI.handleDrag = (callData) => {
    const widgetState = publicAPI.getWidgetState();
    if (widgetState && model.manipulator) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        publicAPI.getOpenGLRenderWindow()
      );

      if (worldCoords.length) {
        model.widgetState.getHandle().setPosition(...worldCoords);
      }

      model.renderer.resetCameraClippingRange();
      model.interactor.render();

      return macro.EVENT_ABORT;
    }

    return macro.VOID;
  };

  publicAPI.handleMouseMove = (callData) => {
    const widgetState = publicAPI.getWidgetState();
    if (widgetState && model.manipulator) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        publicAPI.getOpenGLRenderWindow()
      );

      if (worldCoords.length) {
        model.widgetState.getHandle().setPosition(...worldCoords);
      }

      model.renderer.resetCameraClippingRange();
      model.interactor.render();
    }
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
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidget.extend(publicAPI, model, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['manipulator']);

  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
