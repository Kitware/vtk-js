import macro from 'vtk.js/Sources/macros';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('SeedWidgetProp');

  const state = model.widgetState;
  const moveHandle = state.getMoveHandle();
  moveHandle.setVisible(true);
  // default color is red
  moveHandle.setColor3(255, 0, 0);
  model._isDragging = false;
  model.previousPosition = null;

  function isValidHandle(handle) {
    return handle === moveHandle;
  }

  function isPlaced() {
    return !!moveHandle.getOrigin();
  }

  function currentWorldCoords(e) {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    return manipulator.handleEvent(e, model._apiSpecificRenderWindow)
      .worldCoords;
  }

  // Update the handle's center.  Example:
  // handle.setCenter([1,2,3]);
  publicAPI.setCenter = (newCenter) => {
    moveHandle.setOrigin(newCenter);
    model._widgetManager.enablePicking();
  };

  publicAPI.handleLeftButtonPress = (e) => {
    if (!isValidHandle(model.activeState)) {
      model.activeState = null;
      return macro.VOID;
    }
    const worldCoords = currentWorldCoords(e);

    if (model.activeState === moveHandle) {
      if (!moveHandle.getOrigin()) {
        moveHandle.setOrigin(worldCoords);
      }
    }
    model._isDragging = true;
    model._apiSpecificRenderWindow.setCursor('grabbing');
    model.previousPosition = [...currentWorldCoords(e)];
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleLeftButtonRelease = (e) => {
    if (!model._isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (isPlaced()) {
      model.previousPosition = null;
      model._widgetManager.enablePicking();
      model._apiSpecificRenderWindow.setCursor('pointer');
      model._isDragging = false;
      model.activeState = null;
      state.deactivate();
    }
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (e) => {
    if (!model._isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (!model.activeState) throw Error('no activestate');
    const worldCoords = currentWorldCoords(e);
    model.activeState.setOrigin(worldCoords);
    model.previousPosition = worldCoords;
    return macro.VOID;
  };

  publicAPI.grabFocus = () => {
    moveHandle.setVisible(true);
    model._isDragging = true;
    model.activeState = moveHandle;
    model._interactor.render();
  };

  publicAPI.loseFocus = () => {
    model._isDragging = false;
    model.activeState = null;
  };
}
