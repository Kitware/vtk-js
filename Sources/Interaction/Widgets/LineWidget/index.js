import HandleRepConstants from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkHandleWidget from 'vtk.js/Sources/Interaction/Widgets/HandleWidget';
import vtkLineRepresentation from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation';
import { State } from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation/Constants';
import Constants from './Constants';

const { vtkErrorMacro } = macro;
const { WidgetState } = Constants;
const { InteractionState } = HandleRepConstants;

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

function vtkLineWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLineWidget');

  const superClass = Object.assign({}, publicAPI);

  function setCursor(state) {
    switch (state) {
      case State.OUTSIDE: {
        model.interactor.getView().setCursor('default');
        break;
      }
      default: {
        model.interactor.getView().setCursor('pointer');
      }
    }
  }

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
        })
      );
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

  publicAPI.setEnable = (enabling) => {
    const enable = model.enabled;
    superClass.setEnable(enabling);

    if (model.interactor) {
      model.point1Widget.setInteractor(model.interactor);
      model.point2Widget.setInteractor(model.interactor);
    }

    publicAPI.createDefaultRepresentation();
    model.point1Widget.setWidgetRep(model.widgetRep.getPoint1Representation());
    model.point2Widget.setWidgetRep(model.widgetRep.getPoint2Representation());

    if (enabling) {
      model.point1Widget.setEnable(1);
      model.point2Widget.setEnable(1);
      if (model.widgetState === WidgetState.START) {
        model.widgetRep.setLineVisibility(0);
        model.widgetRep.setPoint1Visibility(0);
        model.widgetRep.setPoint2Visibility(0);
        model.point1Widget.setEnable(0);
        model.point2Widget.setEnable(0);
      } else {
        model.widgetRep.setLineVisibility(1);
        model.widgetRep.setPoint1Visibility(1);
        model.widgetRep.setPoint2Visibility(1);

        // // Widgets can't be enabled together because of interaction event which doesn't
        // // manage priority
        // model.point1Widget.setEnable(1);
        // model.point2Widget.setEnable(1);
      }
    }

    if (enabling && !enable) {
      model.point1Widget.setWidgetRep(
        model.widgetRep.getPoint1Representation()
      );
      model.point2Widget.setWidgetRep(
        model.widgetRep.getPoint2Representation()
      );
      model.point1Widget.getWidgetRep().setRenderer(model.currentRenderer);
      model.point2Widget.getWidgetRep().setRenderer(model.currentRenderer);
    } else if (!enabling && enable) {
      model.point1Widget.setEnable(0);
      model.point2Widget.setEnable(0);
    }
  };

  publicAPI.setWidgetStateToStart = () => {
    model.widgetState = WidgetState.START;
    model.currentHandle = 0;
    model.widgetRep.buildRepresentation();
    publicAPI.setEnable(model.enabled);
  };

  publicAPI.setWidgetStateToManipulate = () => {
    model.widgetState = WidgetState.MANIPULATE;
    model.currentHandle = -1;
    model.widgetRep.buildRepresentation();
    publicAPI.setEnable(model.enabled);
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
    if (model.widgetRep.getInteractionState === InteractionState.OUTSIDE) {
      return;
    }
    const position = publicAPI.get2DPointerPosition();

    if (model.widgetState === WidgetState.START) {
      const pos3D = model.point1Widget
        .getWidgetRep()
        .displayToWorld(position, 0);
      // The first time we click, the method is called twice
      if (model.currentHandle <= 1) {
        model.point1Widget.setEnable(0);
        model.point2Widget.setEnable(0);
        model.widgetRep.setPoint1Visibility(1);
        model.widgetRep.setLineVisibility(1);
        model.widgetRep.setPoint2Visibility(0);
        model.widgetRep.setPoint1WorldPosition(pos3D);
        // Trick to avoid a line with a zero length
        // If the line has a zero length, it appears with bad extremities
        pos3D[0] += 0.000000001;
        model.widgetRep.setPoint2WorldPosition(pos3D);
        model.currentHandle++;
      } else {
        model.point1Widget.setEnable(0);
        model.widgetRep.setPoint1Visibility(1);
        model.widgetRep.setLineVisibility(1);
        model.widgetRep.setPoint2Visibility(1);
        model.point2Widget.setEnable(0);
        model.widgetRep.setPoint2WorldPosition(pos3D);
        // When two points are placed, we go back to the native
        publicAPI.setWidgetStateToManipulate();
        model.currentHandle++;
      }
    } else {
      model.widgetState = WidgetState.ACTIVE;
      model.currentHandle = 0;
      publicAPI.invokeStartInteractionEvent();
    }

    model.widgetRep.startComplexWidgetInteraction(position);

    publicAPI.render();
  };

  publicAPI.translateAction = () => {
    if (model.widgetRep.getInteractionState === InteractionState.OUTSIDE) {
      return;
    }
    const state = model.widgetRep.getInteractionState();
    if (state === State.ONP1) {
      model.widgetRep.setInteractionState(State.TRANSLATINGP1);
    } else if (state === State.ONP2) {
      model.widgetRep.setInteractionState(State.TRANSLATINGP2);
    } else {
      model.widgetRep.setInteractionState(State.ONLINE);
    }

    const position = publicAPI.get2DPointerPosition();
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.scaleAction = () => {
    if (model.widgetRep.getInteractionState === InteractionState.OUTSIDE) {
      return;
    }
    model.widgetRep.setInteractionState(State.SCALING);
    const position = publicAPI.get2DPointerPosition();
    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.moveAction = () => {
    const position = publicAPI.get2DPointerPosition();

    // Need to check where the mouse is
    if (model.widgetState === WidgetState.MANIPULATE) {
      model.interactor.disable(); // to avoid extra renders()

      model.point1Widget.setEnable(0);
      model.point2Widget.setEnable(0);

      if (model.currentHandle === 1) {
        model.point1Widget.setEnable(1);
      }
      if (model.currentHandle === 2) {
        model.widgetRep.complexWidgetInteraction(position);
      }

      const state = model.widgetRep.computeInteractionState(position);
      setCursor(state);
      if (state !== State.OUTSIDE) {
        if (state === State.ONP1) {
          model.point1Widget.setEnable(1);
        } else if (state === State.ONP2) {
          model.point2Widget.setEnable(1);
        }
      }
      model.interactor.enable();
    } else if (model.widgetState === WidgetState.START) {
      model.widgetRep.setPoint1Visibility(1);
      model.widgetRep.complexWidgetInteraction(position);
      const pos3D = model.point1Widget
        .getWidgetRep()
        .displayToWorld(position, 0);
      if (model.currentHandle === 0) {
        model.widgetRep.setPoint1WorldPosition(pos3D);
      }
      model.widgetRep.setPoint2WorldPosition(pos3D);
    } else if (model.widgetState === WidgetState.ACTIVE) {
      model.widgetRep.setPoint1WorldPosition(
        model.point1Widget.getWidgetRep().getWorldPosition()
      );
      model.widgetRep.setPoint2WorldPosition(
        model.point2Widget.getWidgetRep().getWorldPosition()
      );
    }

    publicAPI.invokeInteractionEvent();
    publicAPI.render();
  };

  publicAPI.endSelectAction = () => {
    if (model.widgetState === WidgetState.START) {
      return;
    }
    const position = publicAPI.get2DPointerPosition();
    model.widgetRep.complexWidgetInteraction(position);
    model.widgetRep.setPoint1WorldPosition(
      model.point1Widget.getWidgetRep().getWorldPosition()
    );
    model.widgetRep.setPoint2WorldPosition(
      model.point2Widget.getWidgetRep().getWorldPosition()
    );

    model.widgetState = WidgetState.MANIPULATE;
    publicAPI.invokeEndInteractionEvent();
    publicAPI.render();
  };

  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkLineRepresentation.newInstance();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgetState: WidgetState.START,
  managesCursor: 1,
  currentHandle: -1,
  point1Widget: null,
  point2Widget: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractWidget.extend(publicAPI, model, initialValues);

  model.point1Widget = vtkHandleWidget.newInstance();
  model.point1Widget.setParent(publicAPI);
  model.point1Widget.createDefaultRepresentation();

  model.point2Widget = vtkHandleWidget.newInstance();
  model.point2Widget.setParent(publicAPI);
  model.point2Widget.createDefaultRepresentation();

  // Object methods
  vtkLineWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
