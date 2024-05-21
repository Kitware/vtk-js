import macro from 'vtk.js/Sources/macros';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('SeedWidgetProp');

  const moveHandle = model.widgetState.getMoveHandle();
  moveHandle.setVisible(true);
  model._isDragging = false;

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
      if (!moveHandle.getOrigin() && worldCoords) {
        moveHandle.setOrigin(worldCoords);
      }
    }
    model._isDragging = true;
    model._apiSpecificRenderWindow.setCursor('grabbing');
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleLeftButtonRelease = (e) => {
    if (!model._isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (isPlaced()) {
      model._widgetManager.enablePicking();
      model._apiSpecificRenderWindow.setCursor('pointer');
      model._isDragging = false;
      model.activeState = null;
      model.widgetState.deactivate();
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
