import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/SphereHandleRepresentation';
import vtkHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';
import Constants from 'vtk.js/Sources/Interaction/Widgets/HandleWidget/Constants';

const { VOID, EVENT_ABORT } = macro;
const { InteractionState } = vtkHandleRepresentation;
const { WidgetState } = Constants;

// ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

function vtkHandleWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleWidget');

  function setCursor(state) {
    switch (state) {
      case InteractionState.OUTSIDE: {
        model.interactor.getView().setCursor('default');
        break;
      }
      default: {
        model.interactor.getView().setCursor('pointer');
      }
    }
  }

  function genericAction() {
    setCursor(model.widgetRep.getInteractionState());
    model.widgetRep.highlight(1);
    // publicAPI.startInteraction();
    publicAPI.invokeStartInteractionEvent();
    publicAPI.render();
  }

  // Overriden method
  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkSphereHandleRepresentation.newInstance();
    }
  };

  publicAPI.handleMouseMove = () => publicAPI.moveAction();

  publicAPI.handleLeftButtonPress = () => publicAPI.selectAction();

  publicAPI.handleLeftButtonRelease = () => publicAPI.endSelectAction();

  publicAPI.handleMiddleButtonPress = () => publicAPI.translateAction();

  publicAPI.handleMiddleButtonRelease = () => publicAPI.endSelectAction();

  publicAPI.handleRightButtonPress = () => publicAPI.scaleAction();

  publicAPI.handleRightButtonRelease = () => publicAPI.endSelectAction();

  publicAPI.selectAction = () => {
    const pos = model.interactor.getEventPosition(
      model.interactor.getPointerIndex()
    );
    const position = [pos.x, pos.y];
    model.widgetRep.computeInteractionState(position);
    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return VOID;
    }
    model.widgetRep.startComplexWidgetInteraction(position);
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.SELECTING);
    genericAction();
    return EVENT_ABORT;
  };

  publicAPI.translateAction = () => {
    const pos = model.interactor.getEventPosition(
      model.interactor.getPointerIndex()
    );
    const position = [pos.x, pos.y];
    model.widgetRep.startComplexWidgetInteraction(position);
    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return VOID;
    }
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.TRANSLATING);
    genericAction();
    return EVENT_ABORT;
  };

  publicAPI.scaleAction = () => {
    if (!model.allowHandleResize) {
      return VOID;
    }
    const pos = model.interactor.getEventPosition(
      model.interactor.getPointerIndex()
    );
    const position = [pos.x, pos.y];
    model.widgetRep.startComplexWidgetInteraction(position);
    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return VOID;
    }
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.SCALING);
    genericAction();
    return EVENT_ABORT;
  };

  publicAPI.endSelectAction = () => {
    if (model.widgetState !== WidgetState.ACTIVE) {
      return VOID;
    }
    model.widgetState = WidgetState.START;
    model.widgetRep.highlight(0);
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();
    return EVENT_ABORT;
  };

  publicAPI.moveAction = () => {
    const pos = model.interactor.getEventPosition(
      model.interactor.getPointerIndex()
    );
    const position = [pos.x, pos.y];
    if (model.widgetState === WidgetState.START) {
      const state = model.widgetRep.getInteractionState();
      model.widgetRep.computeInteractionState(position);
      setCursor(model.widgetRep.getInteractionState());
      if (
        model.widgetRep.getActiveRepresentation() &&
        state !== model.widgetRep.getInteractionState()
      ) {
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
  allowHandleResize: 1,
  widgetState: WidgetState.START,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractWidget.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['allowHandleResize']);

  // Object methods
  vtkHandleWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHandleWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
