import macro from 'vtk.js/Sources/macro';

import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkResliceCursorLineRepresentation from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorLineRepresentation';

import { WidgetState } from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorWidget/Constants';
import { InteractionState } from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorRepresentation/Constants';

const { VOID, EVENT_ABORT } = macro;

// ----------------------------------------------------------------------------
// vtkResliceCursorWidget methods
// ----------------------------------------------------------------------------

function vtkResliceCursorWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorWidget');

  // const superClass = Object.assign({}, publicAPI);

  function setCursor(state) {
    switch (state) {
      case InteractionState.ON_AXIS1:
      case InteractionState.ON_AXIS2:
      case InteractionState.ON_CENTER: {
        model.interactor.getView().setCursor('pointer');
        break;
      }
      default: {
        model.interactor.getView().setCursor('default');
      }
    }
  }

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkResliceCursorLineRepresentation.newInstance();
    }
  };

  publicAPI.handleMouseMove = (callData) => publicAPI.moveAction(callData);

  publicAPI.handleLeftButtonPress = (callData) =>
    publicAPI.selectAction(callData);

  publicAPI.handleLeftButtonRelease = (callData) =>
    publicAPI.endSelectAction(callData);

  publicAPI.selectAction = (callData) => {
    const position = [callData.position.x, callData.position.y];

    const state = model.widgetRep.computeInteractionState(position);

    if (state === InteractionState.OUTSIDE) {
      return VOID;
    }

    model.widgetRep.startComplexWidgetInteraction(position);
    model.widgetState = WidgetState.ACTIVE;
    setCursor(state);
    publicAPI.invokeStartInteractionEvent();
    publicAPI.render();

    return EVENT_ABORT;
  };

  publicAPI.endSelectAction = () => {
    if (model.widgetState !== WidgetState.ACTIVE) {
      return VOID;
    }

    model.widgetState = WidgetState.START;
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();

    return EVENT_ABORT;
  };

  publicAPI.moveAction = (callData) => {
    const position = [callData.position.x, callData.position.y];

    if (model.widgetState === WidgetState.START) {
      const state = model.widgetRep.getInteractionState();
      model.widgetRep.computeInteractionState(position);
      setCursor(model.widgetRep.getInteractionState());
      if (state !== model.widgetRep.getInteractionState()) {
        publicAPI.render();
      }
      return VOID;
    }
    model.widgetRep.complexWidgetInteraction(position);
    publicAPI.invokeInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgetState: WidgetState.START,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkAbstractWidget.extend(publicAPI, model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkResliceCursorWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkResliceCursorWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
