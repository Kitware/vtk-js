import macro from 'vtk.js/Sources/macros';

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkLabelWidgetProp');

  model.isDragging = null;

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  publicAPI.setText = (text) => {
    model.widgetState.getText().setText(text);
    model.representations[1].setCircleProps({
      ...model.representations[1].getCircleProps(),
      visible: !text,
    });
    model.interactor.render();
  };

  publicAPI.getText = () => model.widgetState.getText().getText();

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

  // --------------------------------------------------------------------------
  // Left press: Select handle to drag / Place text handle
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

    if (model.activeState === model.widgetState.getMoveHandle()) {
      // Commit handle to location
      const moveHandle = model.widgetState.getMoveHandle();
      model.widgetState.getText().setOrigin(moveHandle.getOrigin());
      publicAPI.loseFocus();
    } else {
      model.isDragging = true;
      model.apiSpecificRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    if (model.isDragging && model.pickable) {
      model.apiSpecificRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }

    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      publicAPI.invokeEndInteractionEvent();
      model.widgetManager.enablePicking();
      model.interactor.render();
    }

    model.isDragging = false;
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
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.apiSpecificRenderWindow
      );

      if (
        worldCoords.length &&
        (model.activeState === model.widgetState.getMoveHandle() ||
          model.isDragging)
      ) {
        model.activeState.setOrigin(worldCoords);
        model.widgetState.getText().setOrigin(model.activeState.getOrigin());
        publicAPI.invokeInteractionEvent();
        return macro.EVENT_ABORT;
      }
    }

    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Focus API
  // --------------------------------------------------------------------------

  publicAPI.reset = () => {
    model.widgetState.getMoveHandle().setOrigin(null);
    model.widgetState.getText().setOrigin(null);
    model.widgetState.getText().setText('');
  };

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      publicAPI.reset();

      model.activeState = model.widgetState.getMoveHandle();
      model.widgetState.getMoveHandle().activate();
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }
    model.hasFocus = true;
  };

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }
    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.activeState = null;
    model.hasFocus = false;
    model.widgetManager.enablePicking();
    model.interactor.render();
  };
}
