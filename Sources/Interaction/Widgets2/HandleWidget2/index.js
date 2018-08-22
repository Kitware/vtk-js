import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/SphereHandleRepresentation';
import vtkStateBuilder from 'vtk.js/Sources/Interaction/Widgets2/StateBuilder';

// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkHandleWidget');

  model.representationBuilder = {
    DEFAULT: [{ builder: vtkSphereHandleRepresentation, labels: ['handle'] }],
  };
  model.viewTypeAlias = ['DEFAULT', 'DEFAULT', 'DEFAULT', 'DEFAULT'];

  // State
  model.widgetState = vtkStateBuilder
    .createBuilder()
    .add(['handle'], 'sphere', 'handle', {
      radius: 0.5,
      position: [0, 0, 0],
    })
    .build();

  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    const widgetState = publicAPI.getWidgetState();
    if (widgetState && model.manipulator) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        publicAPI.getOpenGLRenderWindow()
      );

      if (worldCoords) {
        console.log(worldCoords);
        model.widgetState.getHandle().setPosition(...worldCoords);
      }

      model.renderer.resetCameraClippingRange();
      model.interactor.render();
    }
  };
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
