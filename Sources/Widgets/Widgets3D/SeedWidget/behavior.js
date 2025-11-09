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

  publicAPI.setCenter = (newCenter) => {
    moveHandle.setOrigin(newCenter);
    model._interactor.render();
  };

  publicAPI.startInteract = () => {
    model._widgetManager.enablePicking();
    publicAPI.grabFocus();
    model._apiSpecificRenderWindow.setCursor('grabbing');
    publicAPI.invokeStartInteractionEvent();
  };

  publicAPI.endInteract = () => {
    publicAPI.loseFocus();
    model._apiSpecificRenderWindow.setCursor('pointer');
    model.widgetState.deactivate();
    publicAPI.invokeEndInteractionEvent();
  };

  publicAPI.handleLeftButtonPress = (e) => {
    if (!isValidHandle(model.activeState)) {
      model.activeState = null;
      return macro.VOID;
    }
    const worldCoords = currentWorldCoords(e);

    if (model.activeState === moveHandle) {
      if (!moveHandle.getOrigin() && worldCoords) {
        publicAPI.setCenter(worldCoords);
      }
    }
    publicAPI.startInteract();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleLeftButtonRelease = (e) => {
    if (!model._isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (isPlaced()) {
      publicAPI.endInteract();
    }
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
  };

  publicAPI.loseFocus = () => {
    model._isDragging = false;
    model.activeState = null;
  };
}
