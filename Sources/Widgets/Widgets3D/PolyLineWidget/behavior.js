import macro from 'vtk.js/Sources/macros';
import { add } from 'vtk.js/Sources/Common/Core/Math';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineWidgetProp');
  model._isDragging = false;

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Interactor events
  // --------------------------------------------------------------------------

  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  function updateMoveHandle(callData) {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    if (!manipulator) {
      return macro.VOID;
    }

    const { worldCoords, worldDelta } = manipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    const isHandleMoving =
      model.activeState === model.widgetState.getMoveHandle() ||
      model._isDragging;

    // the line is pickable but not draggable
    const isPickingLine = !model.activeState.setOrigin;

    if (worldCoords.length && isHandleMoving && !isPickingLine) {
      const curOrigin = model.activeState.getOrigin();
      if (curOrigin) {
        model.activeState.setOrigin(add(curOrigin, worldDelta, []));
      } else {
        model.activeState.setOrigin(worldCoords);
      }
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  }

  // --------------------------------------------------------------------------
  // Right click: Delete handle
  // --------------------------------------------------------------------------

  publicAPI.handleRightButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      ignoreKey(e)
    ) {
      return macro.VOID;
    }

    if (model.activeState !== model.widgetState.getMoveHandle()) {
      model._interactor.requestAnimation(publicAPI);
      model.activeState.deactivate();
      model.widgetState.removeHandle(model.activeState);
      model.activeState = null;
      model._interactor.cancelAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    publicAPI.invokeInteractionEvent();
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left press: Select handle to drag
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      ignoreKey(e)
    ) {
      return macro.VOID;
    }
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;

    if (
      model.activeState === model.widgetState.getMoveHandle() &&
      manipulator
    ) {
      updateMoveHandle(e);
      const moveHandle = model.widgetState.getMoveHandle();
      const newHandle = model.widgetState.addHandle();
      newHandle.setOrigin(moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
      newHandle.setManipulator(manipulator);
    } else if (model.dragable) {
      // Update worldDelta
      manipulator.handleEvent(e, model._apiSpecificRenderWindow);
      model._isDragging = true;
      model._apiSpecificRenderWindow.setCursor('grabbing');
      model._interactor.requestAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (
      model.pickable &&
      model.dragable &&
      model.activeState &&
      model.activeState.getActive() &&
      !ignoreKey(callData)
    ) {
      if (updateMoveHandle(callData) === macro.EVENT_ABORT) {
        return macro.EVENT_ABORT;
      }
    }
    if (model.hasFocus) {
      model._widgetManager.disablePicking();
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    if (model._isDragging) {
      model._apiSpecificRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model._interactor.cancelAnimation(publicAPI);
      model._isDragging = false;
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }

    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      model._widgetManager.enablePicking();
      model._interactor.render();
    }

    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Escape key: Release focus to switch to drag mode
  // --------------------------------------------------------------------------

  publicAPI.handleKeyDown = ({ key }) => {
    if (key === 'Escape') {
      publicAPI.loseFocus();
    }
  };

  // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.activate();
      model.activeState.setVisible(true);
      model._interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }
    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model._interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }
    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.widgetState.getMoveHandle().setVisible(false);
    model.widgetState.getMoveHandle().setOrigin(null);
    model.activeState = null;
    model.hasFocus = false;
    model._widgetManager.enablePicking();
    model._interactor.render();
  };
}
