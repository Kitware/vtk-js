import macro from 'vtk.js/Sources/macro';
import Constants from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation/Constants';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkPointPlacer from 'vtk.js/Sources/Interaction/Widgets/PointPlacer';
import vtkWidgetRepresentation from 'vtk.js/Sources/Interaction/Widgets/WidgetRepresentation';

const { InteractionState } = Constants;

// ----------------------------------------------------------------------------
// vtkHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleRepresentation');

  publicAPI.setDisplayPosition = (displayPos) => {
    if (model.renderer && model.pointPlacer) {
      const worldPos = [];
      if (
        model.pointPlacer.computeWorldPosition(
          model.renderer,
          displayPos,
          worldPos
        )
      ) {
        model.displayPosition.setValue(displayPos);
        model.worldPosition.setValue(worldPos);
      }
    } else {
      model.displayPosition.setValue(displayPos);
    }
  };

  publicAPI.getDisplayPosition = (pos) => {
    if (model.renderer) {
      const p = model.worldPosition.getComputedDisplayValue(model.renderer);
      model.displayPosition.setValue(p[0], p[1], 0.0);
    }
    pos[0] = model.displayPosition.getValue()[0];
    pos[1] = model.displayPosition.getValue()[1];
    pos[2] = model.displayPosition.getValue()[2];
  };

  publicAPI.getDisplayPosition = () => {
    if (model.renderer) {
      const p = model.worldPosition.getComputedDisplayValue(model.renderer);
      model.displayPosition.setValue(p[0], p[1], 0.0);
    }
    return model.displayPosition.getValue();
  };

  publicAPI.setWorldPosition = (pos) => {
    model.worldPosition.setValue(pos);
  };

  publicAPI.getWorldPosition = (pos) => {
    model.worldPosition.getValue(pos);
  };

  publicAPI.getWorldPosition = () => model.worldPosition.getValue();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  displayPosition: null,
  worldPosition: null,
  tolerance: 15,
  activeRepresentation: 0,
  constrained: 0,
  pointPlacer: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);

  model.displayPosition = vtkCoordinate.newInstance();
  model.displayPosition.setCoordinateSystemToDisplay();
  model.worldPosition = vtkCoordinate.newInstance();
  model.worldPosition.setCoordinateSystemToWorld();
  model.pointPlacer = vtkPointPlacer.newInstance();
  model.interactionState = InteractionState.OUTSIDE;

  macro.setGet(publicAPI, model, ['activeRepresentation', 'tolerance']);

  // Object methods
  vtkHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleRepresentation');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
