import HandleRepConstants from 'vtk.js/Sources/Interaction/Widgets/HandleRepresentation/Constants';
import macro from 'vtk.js/Sources/macro';
import vtkAbstractWidget from 'vtk.js/Sources/Interaction/Widgets/AbstractWidget';
import vtkHandleWidget from 'vtk.js/Sources/Interaction/Widgets/HandleWidget';
import vtkLineRepresentation from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation';
import { State } from 'vtk.js/Sources/Interaction/Widgets/LineRepresentation/Constants';
import Constants from './Constants';

const { WidgetState } = Constants;
const { InteractionState } = HandleRepConstants;

// ----------------------------------------------------------------------------
// vtkHandleWidget methods
// ----------------------------------------------------------------------------

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

  publicAPI.setEnabled = (enabling) => {
    superClass.setEnabled(enabling);

    if (!model.widgetRep) {
      return;
    }
    // Use the representations from the line widget
    // for the point widgets to avoid creating
    // default representations when setting the
    // interactor below
    model.point1Widget.setWidgetRep(model.widgetRep.getPoint1Representation());
    model.point2Widget.setWidgetRep(model.widgetRep.getPoint2Representation());
    model.point1Widget.setInteractor(model.interactor);
    model.point2Widget.setInteractor(model.interactor);

    if (model.widgetState === WidgetState.START) {
      model.point1Widget.setEnabled(0);
      model.point2Widget.setEnabled(0);
      model.widgetRep.setLineVisibility(0);
      model.widgetRep.setPoint1Visibility(1);
      model.widgetRep.setPoint2Visibility(0);
    } else {
      model.point1Widget.setEnabled(enabling);
      model.point2Widget.setEnabled(enabling);
      model.widgetRep.setLineVisibility(1);
      model.widgetRep.setPoint1Visibility(1);
      model.widgetRep.setPoint2Visibility(1);
    }
  };

  publicAPI.setWidgetStateToStart = () => {
    model.widgetState = WidgetState.START;
    model.currentHandle = 0;
    publicAPI.setEnabled(model.enabled);
  };

  publicAPI.setWidgetStateToManipulate = () => {
    model.widgetState = WidgetState.MANIPULATE;
    model.currentHandle = -1;
    publicAPI.setEnabled(model.enabled);
  };

  publicAPI.handleMouseMove = (callData) => publicAPI.moveAction(callData);

  publicAPI.handleLeftButtonPress = (callData) =>
    publicAPI.selectAction(callData);

  publicAPI.handleLeftButtonRelease = (callData) =>
    publicAPI.endSelectAction(callData);

  publicAPI.handleMiddleButtonPress = (callData) =>
    publicAPI.translateAction(callData);

  publicAPI.handleMiddleButtonRelease = (callData) =>
    publicAPI.endSelectAction(callData);

  publicAPI.handleRightButtonPress = (callData) =>
    publicAPI.scaleAction(callData);

  publicAPI.handleRightButtonRelease = (callData) =>
    publicAPI.endSelectAction(callData);

  publicAPI.selectAction = (callData) => {
    const position = [callData.position.x, callData.position.y];

    if (model.widgetState === WidgetState.START) {
      const pos3D = model.point1Widget
        .getWidgetRep()
        .displayToWorld(position, 0);
      // The first time we click, the method is called twice
      if (model.currentHandle < 1) {
        model.widgetRep.setLineVisibility(1);
        model.widgetRep.setPoint1WorldPosition(pos3D);
        // Trick to avoid a line with a zero length
        // If the line has a zero length, it appears with bad extremities
        pos3D[0] += 0.000000001;
        model.widgetRep.setPoint2WorldPosition(pos3D);
        model.currentHandle++;
      } else {
        model.widgetRep.setPoint2Visibility(1);
        model.widgetRep.setPoint2WorldPosition(pos3D);
        // When two points are placed, we go back to the native
        model.widgetState = WidgetState.MANIPULATE;
        model.currentHandle = -1;
      }
    } else {
      const state = model.widgetRep.computeInteractionState(position);
      if (state === InteractionState.OUTSIDE) {
        return;
      }
      model.widgetState = WidgetState.ACTIVE;
      publicAPI.invokeStartInteractionEvent();
    }

    model.widgetRep.startComplexWidgetInteraction(position);

    publicAPI.render();
  };

  publicAPI.translateAction = (callData) => {
    const position = [callData.position.x, callData.position.y];
    const state = model.widgetRep.computeInteractionState(position);
    if (state === InteractionState.OUTSIDE) {
      return;
    }

    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.scaleAction = (callData) => {
    const position = [callData.position.x, callData.position.y];
    const state = model.widgetRep.computeInteractionState(position);
    if (state === InteractionState.OUTSIDE) {
      return;
    }

    model.widgetState = WidgetState.ACTIVE;
    model.widgetRep.startComplexWidgetInteraction(position);
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.moveAction = (callData) => {
    const position = [callData.position.x, callData.position.y];

    if (model.widgetState === WidgetState.MANIPULATE) {
      // In MANIPULATE, we are hovering above the widget
      // Check if above a sphere and enable/disable if needed
      const state = model.widgetRep.computeInteractionState(position);
      setCursor(state);
      if (state !== State.OUTSIDE) {
        if (state === State.ONP1) {
          model.point1Widget.setEnabled(1);
          model.point2Widget.setEnabled(0);
        } else if (state === State.ONP2) {
          model.point1Widget.setEnabled(0);
          model.point2Widget.setEnabled(1);
        }
      } else {
        model.point1Widget.setEnabled(0);
        model.point2Widget.setEnabled(0);
      }
    } else if (model.widgetState === WidgetState.START) {
      // In START, we are placing the sphere widgets.
      // Move current handle along the mouse position.
      model.widgetRep.complexWidgetInteraction(position);
      const pos3D = model.point1Widget
        .getWidgetRep()
        .displayToWorld(position, 0);
      if (model.currentHandle === 0) {
        model.widgetRep.setPoint1WorldPosition(pos3D);
      } else {
        model.widgetRep.setPoint2WorldPosition(pos3D);
      }
    } else if (model.widgetState === WidgetState.ACTIVE) {
      // In ACTIVE, we are moving a sphere widget.
      // Update the line extremities to follow the spheres.
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

  publicAPI.endSelectAction = (callData) => {
    if (model.widgetState === WidgetState.START) {
      return;
    }
    const position = [callData.position.x, callData.position.y];
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
