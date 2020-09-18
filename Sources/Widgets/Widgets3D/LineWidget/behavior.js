import macro from 'vtk.js/Sources/macro';

const MAX_POINTS = 2;

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkDistanceWidgetProp');
  let isDragging = null;
  const direction = [0, 0, 0];

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

  function updateConeDirection(behavior, callData) {
    let bv = behavior;
    if (bv === 3) {
      const test = publicAPI.computeWorldToDisplay(
        model.renderer,
        model.widgetState.getHandle1List()[0].getOrigin()[0],
        model.widgetState.getHandle1List()[0].getOrigin()[1],
        model.widgetState.getHandle1List()[0].getOrigin()[2]
      );
      const mousePos = publicAPI.computeDisplayToWorld(
        model.renderer,
        callData.position.x,
        callData.position.y,
        test[2]
      );
      for (let i = 0; i < 3; i++) {
        direction[i] =
          model.widgetState.getHandle1List()[0].getOrigin()[i] - mousePos[i];
      }
      bv = 0;
    } else {
      const modifier = bv === 1 ? 1 : -1;
      bv -= 1;
      for (let i = 0; i < 3; i++)
        direction[i] =
          (model.widgetState.getHandle1List()[0].getOrigin()[i] -
            model.widgetState.getHandle2List()[0].getOrigin()[i]) *
          modifier;
    }
    model.representations[bv].getGlyph().setDirection(direction);
  }

  function setConeDirection() {
    if (model.shapeHandle1 === 'cone') {
      updateConeDirection(1);
    }
    if (model.shapeHandle2 === 'cone') {
      updateConeDirection(2);
    }
  }

  function setTextPosition(ofset, ofsetDir, linePosition) {
    const vector = [0, 0, 0];
    let oD = ofsetDir;
    let lp = linePosition;
    let os = ofset;
    if (linePosition < 0 || linePosition > 1) {
      console.log(
        'Line position should always be between 0 and 1 to remain on the line'
      );
    } else lp = 1 - lp;
    if (ofsetDir !== 0 && ofsetDir !== 1 && ofsetDir !== 2)
      console.log('wrong ofset value');
    if (oD === 1) oD *= -1;
    if (oD === 0) os = 0;
    for (let i = 0; i < 3; i++) {
      vector[i] =
        (model.widgetState.getHandle1List()[0].getOrigin()[i] -
          model.widgetState.getHandle2List()[0].getOrigin()[i]) *
          lp +
        model.widgetState.getHandle2List()[0].getOrigin()[i];
    }
    vector[0] += os;
    return vector;
  }

  function updateTextPosition() {
    const obj = model.widgetState.getTextList()[0];
    obj.setOrigin(
      setTextPosition(model.offset, model.offsetDir, model.lineDir)
    );
  }

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
      model.widgetState.getHandle1List().length === 0
    ) {
      const moveHandle = model.widgetState.getMoveHandle();
      const newHandle = model.widgetState.addHandle1();
      newHandle.setOrigin(...moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
    } else if (
      model.activeState === model.widgetState.getMoveHandle() &&
      model.widgetState.getHandle1List().length === 1 &&
      model.widgetState.getHandle2List().length === 0
    ) {
      const moveHandle = model.widgetState.getMoveHandle();
      const newHandle = model.widgetState.addHandle2();
      newHandle.setOrigin(...moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
      setConeDirection();
      const textHandle = model.widgetState.addText();
      textHandle.setText(model.textInput);
      textHandle.setOrigin(
        setTextPosition(model.offset, model.offsetDir, model.lineDir)
      );
    } else {
      isDragging = true;
      model.openGLRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
    }

    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (
      model.hasFocus &&
      model.widgetState.getHandle1List().length +
        model.widgetState.getHandle2List().length ===
        MAX_POINTS
    ) {
      publicAPI.loseFocus();
      return macro.VOID;
    }

    if (
      model.pickable &&
      model.manipulator &&
      model.activeState &&
      model.activeState.getActive() &&
      !ignoreKey(callData)
    ) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (
        model.activeState === model.widgetState.getMoveHandle() ||
        isDragging
      ) {
        model.activeState.setOrigin(worldCoords);
        publicAPI.invokeInteractionEvent();
        if (isDragging === true) {
          if (model.shapeHandle1 === 'cone' || model.shapeHandle2 === 'cone')
            setConeDirection();
          updateTextPosition();
        } else if (
          model.widgetState.getHandle1List().length +
            model.widgetState.getHandle2List().length ===
            1 &&
          model.shapeHandle1 === 'cone'
        ) {
          updateConeDirection(3, callData);
        }

        return macro.EVENT_ABORT;
      }
    }

    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging && model.pickable) {
      model.openGLRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    } else if (model.activeState !== model.widgetState.getMoveHandle()) {
      model.widgetState.deactivate();
    }
    // here need to implement an active state for my line body
    // to move the complete line
    if (
      (model.hasFocus && !model.activeState) ||
      (model.activeState && !model.activeState.getActive())
    ) {
      publicAPI.invokeEndInteractionEvent();
      model.widgetManager.enablePicking();
      model.interactor.render();
    }
    isDragging = false;
  };

  // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    const handleNb =
      model.widgetState.getHandle1List().length +
      model.widgetState.getHandle2List().length;
    if (!model.hasFocus && handleNb < MAX_POINTS) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.activate();
      model.activeState.setVisible(true);
      model.interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();
    }
    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();
    }
    model.widgetState.deactivate();
    model.widgetState.getMoveHandle().deactivate();
    model.widgetState.getMoveHandle().setVisible(false);
    model.activeState = null;
    model.hasFocus = false;
    model.widgetManager.enablePicking();
    model.interactor.render();
  };
}
