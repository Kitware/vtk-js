import macro from 'vtk.js/Sources/macros';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLineWidgetProp');
  let isDragging = null;

  model.getMaxPoints = model._factory.getMaxPoints;

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
    model.manipulator.setOrigin(model._camera.getFocalPoint());
    model.manipulator.setNormal(model._camera.getDirectionOfProjection());
    const worldCoords = model.manipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );

    if (
      worldCoords.length &&
      (model.activeState === model.widgetState.getMoveHandle() || isDragging)
    ) {
      model.activeState.setOrigin(worldCoords);
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  }

  function canPlacePoints() {
    return model.getMaxPoints()
      ? model.widgetState.getHandleList().length < model.getMaxPoints()
      : true;
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

    if (
      model.activeState === model.widgetState.getMoveHandle() &&
      canPlacePoints()
    ) {
      updateMoveHandle(e);
      // Commit handle to location
      const moveHandle = model.widgetState.getMoveHandle();
      const newHandle = model.widgetState.addHandle();
      newHandle.setOrigin(...moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
    } else {
      isDragging = true;
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
      model.manipulator &&
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
    if (isDragging && model.pickable) {
      model._apiSpecificRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model._interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }

    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      publicAPI.invokeEndInteractionEvent();
      model._widgetManager.enablePicking();
      model._interactor.render();
    }

    // Don't make any more points
    if (!canPlacePoints()) {
      publicAPI.loseFocus();
    }

    isDragging = false;
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
    if (!model.hasFocus && canPlacePoints()) {
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
    model.activeState = null;
    model.hasFocus = false;
    model._widgetManager.enablePicking();
    model._interactor.render();
  };
}
