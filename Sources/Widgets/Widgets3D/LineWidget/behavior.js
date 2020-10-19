import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import macro from 'vtk.js/Sources/macro';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';

import {
  calculateTextPosition,
  updateTextPosition,
} from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/helper';

const MAX_POINTS = 2;

const { Direction, HandleBehavior, HandleRepresentationType } = Constants;

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidgetProp');
  let isDragging = null;

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Interactor event
  // --------------------------------------------------------------------------

  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  /*
   * check for handle 2 position in comparison to handle 1 position
   * and sets text offset to not overlap on the line representation
   */
  function calcTextPosWithLineAngle() {
    const pos1 = model.widgetState.getHandle1().getOrigin();
    const pos2 = model.widgetState.getHandle2().getOrigin();
    const SVGTextProps = model.representations[2].getTextProps();

    let dySign = 1;
    if (pos1[0] <= pos2[0]) {
      dySign = pos1[1] <= pos2[1] ? 1 : -1;
    } else {
      dySign = pos1[1] <= pos2[1] ? -1 : 1;
    }
    SVGTextProps.dy = dySign * Math.abs(SVGTextProps.dy);
  }

  function updateHandleDirection(behavior, callData) {
    let bv = behavior;
    if (bv === HandleBehavior.HANDLE1_ALONE) {
      const handle1Pos = model.widgetState.getHandle1().getOrigin();
      const WorldMousePos = publicAPI.computeWorldToDisplay(
        model.renderer,
        handle1Pos[0],
        handle1Pos[1],
        handle1Pos[2]
      );
      const mousePos = publicAPI.computeDisplayToWorld(
        model.renderer,
        callData.position.x,
        callData.position.y,
        WorldMousePos[2]
      );
      vtkMath.subtract(
        model.widgetState.getHandle1().getOrigin(),
        mousePos,
        Direction
      );
      bv = 0;
    } else {
      const modifier = bv === 1 ? 1 : -1;
      bv -= 1;
      const handle1Pos = model.widgetState.getHandle1().getOrigin();
      const handle2Pos = model.widgetState.getHandle2().getOrigin();
      vtkMath.subtract(handle1Pos, handle2Pos, Direction);
      vtkMath.multiplyScalar(Direction, modifier);
    }
    model.representations[bv].getGlyph().setDirection(Direction);
  }

  function isHandleOrientable(handleType) {
    if (
      handleType === HandleRepresentationType.CONE ||
      handleType === HandleRepresentationType.ARROWHEAD3 ||
      handleType === HandleRepresentationType.ARROWHEAD4 ||
      handleType === HandleRepresentationType.ARROWHEAD6
    )
      return 1;
    return 0;
  }

  function isOrientable() {
    return (
      isHandleOrientable(model.handle1Shape) ||
      isHandleOrientable(model.handle2Shape)
    );
  }

  // set in public to update handle  Direction when handle change in UI
  publicAPI.setHandleDirection = () => {
    if (isHandleOrientable(model.handle1Shape)) {
      updateHandleDirection(HandleBehavior.HANDLE1);
    }
    if (isHandleOrientable(model.handle2Shape)) {
      updateHandleDirection(HandleBehavior.HANDLE2);
    }
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
    const moveHandle = model.widgetState.getMoveHandle();
    moveHandle.setVisible(false);
    if (
      model.activeState === model.widgetState.getMoveHandle() &&
      model.widgetState.getNbHandles() === 0
    ) {
      const handle1 = model.widgetState.getHandle1();
      model.widgetState.setNbHandles(1);
      handle1.setOrigin(...moveHandle.getOrigin());
      handle1.setColor(moveHandle.getColor());
      handle1.setScale1(moveHandle.getScale1());
      handle1.setVisible(true);
      model.widgetState.getHandle2().setOrigin(...moveHandle.getOrigin());
      const SVGLayerText = model.widgetState.getText();
      SVGLayerText.setText(model.text);
      SVGLayerText.setOrigin(
        calculateTextPosition(model, model.widgetState.getPositionOnLine())
      );
    } else if (
      model.activeState === model.widgetState.getMoveHandle() &&
      model.widgetState.getNbHandles() === 1
    ) {
      model.widgetState.setNbHandles(2);
      const handle2 = model.widgetState.getHandle2();
      handle2.setOrigin(...moveHandle.getOrigin());
      handle2.setColor(moveHandle.getColor());
      handle2.setScale1(moveHandle.getScale1());
      handle2.setVisible(true);
      publicAPI.setHandleDirection();
      const SVGLayerText = model.widgetState.getText();
      SVGLayerText.setText(model.text);
      SVGLayerText.setOrigin(
        calculateTextPosition(model, model.widgetState.getPositionOnLine())
      );
      calcTextPosWithLineAngle();
      moveHandle.setVisible(true);
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
    if (model.hasFocus && model.widgetState.getNbHandles() === MAX_POINTS) {
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
      if (model.widgetState.getNbHandles() === 1) {
        model.widgetState.getMoveHandle().setVisible(true);
      }
      if (
        model.activeState === model.widgetState.getMoveHandle() ||
        isDragging
      ) {
        model.activeState.setOrigin(worldCoords);
        publicAPI.invokeInteractionEvent();
        if (isDragging === true) {
          if (isOrientable()) {
            updateTextPosition(model, model.widgetState.getPositionOnLine());
            calcTextPosWithLineAngle();
            publicAPI.setHandleDirection();
          }
        } else if (
          model.widgetState.getNbHandles() === 1 &&
          isHandleOrientable(model.handle1Shape)
        ) {
          updateHandleDirection(HandleBehavior.HANDLE1_ALONE, callData);
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
      calcTextPosWithLineAngle();
      model.openGLRenderWindow.setCursor('pointer');
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
    isDragging = false;
  };

  // --------------------------------------------------------------------------
  // Focus API - modeHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus && model.widgetState.getNbHandles() < MAX_POINTS) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.activate();
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
