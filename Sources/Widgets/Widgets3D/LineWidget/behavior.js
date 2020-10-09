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

  function calcTextPosWithLineAngle() {
    const pos1 = model.widgetState.getHandle1List()[0].getOrigin();
    const pos2 = model.widgetState.getHandle2List()[0].getOrigin();
    const SVGTextProps = model.representations[2].getTextProps();

    if (pos1[0] <= pos2[0]) {
      if (pos1[1] <= pos2[1]) {
        SVGTextProps.dy = Math.abs(SVGTextProps.dy);
      } else {
        SVGTextProps.dy = Math.abs(SVGTextProps.dy) * -1;
      }
    } else {
      SVGTextProps.dy =
        pos1[1] <= pos2[1]
          ? Math.abs(SVGTextProps.dy) * -1
          : Math.abs(SVGTextProps.dy);
    }
  }

  function updateHandleDirection(behavior, callData) {
    let bv = behavior;
    if (bv === HandleBehavior.HANDLE1_ALONE) {
      const handle1Pos = model.widgetState.getHandle1List()[0].getOrigin();
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
        model.widgetState.getHandle1List()[0].getOrigin(),
        mousePos,
        Direction
      );
      bv = 0;
    } else {
      const modifier = bv === 1 ? 1 : -1;
      bv -= 1;
      const handle1Pos = model.widgetState.getHandle1List()[0].getOrigin();
      const handle2Pos = model.widgetState.getHandle2List()[0].getOrigin();
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
    const nbHandle1 = model.widgetState.getHandle1List().length;
    const nbHandle2 = model.widgetState.getHandle2List().length;
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      ignoreKey(e)
    ) {
      return macro.VOID;
    }
    const moveHandle = model.widgetState.getMoveHandle();
    if (
      model.activeState === model.widgetState.getMoveHandle() &&
      nbHandle1 === 0
    ) {
      const newHandle = model.widgetState.addHandle1();
      newHandle.setOrigin(...moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
    } else if (
      model.activeState === model.widgetState.getMoveHandle() &&
      nbHandle1 === 1 &&
      nbHandle2 === 0
    ) {
      const newHandle = model.widgetState.addHandle2();
      newHandle.setOrigin(...moveHandle.getOrigin());
      newHandle.setColor(moveHandle.getColor());
      newHandle.setScale1(moveHandle.getScale1());
      publicAPI.setHandleDirection();
      const SVGLayerText = model.widgetState.addText();
      SVGLayerText.setText(SVGLayerText.getState().text);
      SVGLayerText.setOrigin(
        calculateTextPosition(model, model.widgetState.getPositionOnLine())
      );
      calcTextPosWithLineAngle();
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
    const nbHandles =
      model.widgetState.getHandle1List().length +
      model.widgetState.getHandle2List().length;
    if (model.hasFocus && nbHandles === MAX_POINTS) {
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
          if (isOrientable()) {
            updateTextPosition(model, model.widgetState.getPositionOnLine());
            calcTextPosWithLineAngle();
            publicAPI.setHandleDirection();
          }
        } else if (nbHandles === 1 && isHandleOrientable(model.handle1Shape)) {
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
    const nbHandles =
      model.widgetState.getHandle1List().length +
      model.widgetState.getHandle2List().length;
    if (!model.hasFocus && nbHandles < MAX_POINTS) {
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
