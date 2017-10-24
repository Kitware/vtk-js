import macro                         from 'vtk.js/Sources/macro';
import vtkAbstractWidget             from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkSphereHandleRepresentation from 'vtk.js/Sources/Interaction/Widgets/SphereHandleRepresentation';
import vtkHandleRepresentation       from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation';
import Constants                     from 'vtk.js/Sources/Interaction/Widgets/HandleWidget/Constants';

const { InteractionState } = vtkHandleRepresentation;
const { WidgetState } = Constants;
const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

const events = [
  'MouseMove',
  'LeftButtonPress',
  'LeftButtonRelease',
  'MiddleButtonPress',
  'MiddleButtonRelease',
  'RightButtonPress',
  'RightButtonRelease',
];

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

  // Implemented method
  publicAPI.listenEvents = () => {
    if (!model.interactor) {
      vtkErrorMacro('The interactor must be set before listening events');
      return;
    }
    events.forEach((eventName) => {
      model.unsubscribes.push(
      model.interactor[`on${eventName}`](() => {
        if (publicAPI[`handle${eventName}`]) {
          publicAPI[`handle${eventName}`]();
        }
      }));
    });
  };

  publicAPI.setInteractor = (i) => {
    if (i === model.interactor) {
      return;
    }

    // if we already have an Interactor then stop observing it
    if (model.interactor) {
      while (model.unsubscribes.length) {
        model.unsubscribes.pop().unsubscribe();
      }
    }

    model.interactor = i;

    if (i) {
      publicAPI.listenEvents();
    }
  };

  publicAPI.handleMouseMove = () => {
    publicAPI.moveAction();
  };

  publicAPI.handleLeftButtonPress = () => {
    publicAPI.selectAction();
  };

  publicAPI.handleLeftButtonRelease = () => {
    publicAPI.endSelectAction();
  };

  publicAPI.handleMiddleButtonPress = () => {
    publicAPI.translateAction();
  };

  publicAPI.handleMiddleButtonRelease = () => {
    publicAPI.endSelectAction();
  };

  publicAPI.handleRightButtonPress = () => {
    publicAPI.scaleAction();
  };

  publicAPI.handleRightButtonRelease = () => {
    publicAPI.endSelectAction();
  };

  publicAPI.selectAction = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    const boundingContainer = model.interactor.getCanvas().getBoundingClientRect();
    const position = [pos.x - boundingContainer.left, pos.y + boundingContainer.top];
    model.widgetRep.computeInteractionState(position);
    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return;
    }

    model.widgetRep.startComplexWidgetInteraction(position);
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.SELECTING);
    genericAction();
  };

  publicAPI.translateAction = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    const boundingContainer = model.interactor.getCanvas().getBoundingClientRect();
    const position = [pos.x - boundingContainer.left, pos.y + boundingContainer.top];
    model.widgetRep.startComplexWidgetInteraction(position);
    if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
      return;
    }
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.setInteractionState(InteractionState.TRANSLATING);
    genericAction();
  };

  publicAPI.scaleAction = () => {
    if (model.allowHandleResize) {
      const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
      const boundingContainer = model.interactor.getCanvas().getBoundingClientRect();
      const position = [pos.x - boundingContainer.left, pos.y + boundingContainer.top];
      model.widgetRep.startComplexWidgetInteraction(position);
      if (model.widgetRep.getInteractionState() === InteractionState.OUTSIDE) {
        return;
      }
      model.widgetState = WidgetState.ACTIVE;
      model.widgetRep.setInteractionState(InteractionState.SCALING);
      genericAction();
    }
  };

  publicAPI.endSelectAction = () => {
    if (model.widgetState !== WidgetState.ACTIVE) {
      return;
    }
    model.widgetState = WidgetState.START;
    model.widgetRep.highlight(0);
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();
  };

  publicAPI.moveAction = () => {
    const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
    const boundingContainer = model.interactor.getCanvas().getBoundingClientRect();
    const position = [pos.x - boundingContainer.left, pos.y + boundingContainer.top];
    if (model.widgetState === WidgetState.START) {
      const state = model.widgetRep.getInteractionState();
      model.widgetRep.computeInteractionState(position);
      setCursor(model.widgetRep.getInteractionState());
      if (model.widgetRep.getActiveRepresentation() && state !== model.widgetRep.getInteractionState()) {
        publicAPI.render();
      }
      return;
    }

    model.widgetRep.complexWidgetInteraction(position);
    publicAPI.invokeInteractionEvent();
    publicAPI.render();
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
