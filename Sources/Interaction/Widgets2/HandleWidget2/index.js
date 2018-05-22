import macro, { EVENT_ABORT, VOID } from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets2/HandleRepresentation';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';

// ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  model.classHierarchy.push('vtkHandleWidget');

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

  // virtual override (vtkAbstractWidget)
  publicAPI.createDefaultRepresentation = () =>
    vtkHandleRepresentation.newInstance();

  //----------------------------------------------------------------------------

  publicAPI.selectAction = (callData) => {
    const intersection = model.representation.getEventIntersection(callData);
    if (intersection.intersects) {
      state.updateData({ selected: true });

      publicAPI.render();
      return EVENT_ABORT;
    }
    return VOID;
  };

  //----------------------------------------------------------------------------

  publicAPI.endSelectAction = (callData) => {
    const state = publicAPI.getWidgetState();
    if (state.getData().selected) {
      state.updateData({ selected: false });

      publicAPI.render();
      return EVENT_ABORT;
    }
    return VOID;
  };

  //----------------------------------------------------------------------------

  // Set listeners
  publicAPI.handleLeftButtonPress = publicAPI.selectAction;
  publicAPI.handleLeftButtonRelease = publicAPI.endSelectAction;

  //----------------------------------------------------------------------------

  // initialize handle state
  publicAPI.setWidgetState({
    position: vtkCoordinate.newInstance(),
    selected: false,
  });
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractWidget.extend(publicAPI, model, initialValues);

  // Object methods
  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
