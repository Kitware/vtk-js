import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import macro from 'vtk.js/Sources/macro';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';
import {
  calculateTextPosition,
  updateTextPosition,
  computeDirectionWithTwoPoints,
} from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/helper';

const { HandleRepresentationType } = Constants;
const MAX_POINTS = 2;

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidgetProp');

  const moveHandle = model.widgetState.getMoveHandle();
  const handle1 = model.widgetState.getHandle1();
  const handle2 = model.widgetState.getHandle2();
  const handle1Visibility = model.widgetState.getHandle1Visibility();
  const handle2Visibility = model.widgetState.getHandle2Visibility();
  const handle1FaceCamera = publicAPI.getWidgetState().getHandle1FaceCamera();
  const handle2FaceCamera = publicAPI.getWidgetState().getHandle2FaceCamera();
  const handleToHide = [false, false];

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Interactor event
  // --------------------------------------------------------------------------

  model.handleVisibility = !(
    !model.handle1Visibility && !model.handle2Visibility
  );

  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  function updateCursor() {
    model.isDragging = true;
    model.openGLRenderWindow.setCursor('grabbing');
    model.interactor.requestAnimation(publicAPI);
  }

  // --------------------------------------------------------------------------
  // Text Methods
  // --------------------------------------------------------------------------

  /*
   * getOffsetDirectionForTextPosition
   * check for handle 2 position in comparison to handle 1 position
   * and sets text offset to not overlap on the line representation
   */

  function getOffsetDirectionForTextPosition() {
    const pos1 = model.widgetState.getHandle1().getOrigin();
    const pos2 = model.widgetState.getHandle2().getOrigin();

    let dySign = 1;
    if (pos1[0] <= pos2[0]) {
      dySign = pos1[1] <= pos2[1] ? 1 : -1;
    } else {
      dySign = pos1[1] <= pos2[1] ? -1 : 1;
    }
    return dySign;
  }

  /*
   * This function modifies the position of the SVG Element
   * to avoid having text overlap on PolyLine representation
   */

  function calcTextPosWithLineAngle() {
    const dySign = getOffsetDirectionForTextPosition();
    const textPropsCp = { ...model.representations[2].getTextProps() };
    textPropsCp.dy = dySign * Math.abs(textPropsCp.dy);
    model.representations[2].setTextProps(textPropsCp);
  }

  publicAPI.setText = (text) => {
    model.widgetState.getText().setText(text);
    model.interactor.render();
  };

  publicAPI.updateTextPosition = (positionOnLine) => {
    model.widgetState.setPositionOnLine(positionOnLine);
    updateTextPosition(model, positionOnLine);
    model.interactor.render();
  };

  publicAPI.setPositionOnLine = macro.chain(
    publicAPI.updateTextPosition,
    publicAPI.setPositionOnLine
  );

  // --------------------------------------------------------------------------
  // Handles positioning methods
  // --------------------------------------------------------------------------

  publicAPI.isHandleGlyph2D = (handleShape) => {
    return (
      handleShape === HandleRepresentationType.ARROWHEAD3 ||
      handleShape === HandleRepresentationType.ARROWHEAD4 ||
      handleShape === HandleRepresentationType.ARROWHEAD6 ||
      handleShape === HandleRepresentationType.STAR
      // TODO: implement rotation for circleHandle
    );
  };

  function isHandleOrientable(handleType) {
    return (
      handleType === HandleRepresentationType.CONE ||
      handleType === HandleRepresentationType.ARROWHEAD3 ||
      handleType === HandleRepresentationType.ARROWHEAD4 ||
      handleType === HandleRepresentationType.ARROWHEAD6
    );
  }

  function isOrientable() {
    return (
      isHandleOrientable(model.handle1Shape) ||
      isHandleOrientable(model.handle2Shape)
    );
  }

  function computeMousePosition(p1, callData) {
    const worldMousePos = publicAPI.computeWorldToDisplay(
      model.renderer,
      p1[0],
      p1[1],
      p1[2]
    );
    const mousePos = publicAPI.computeDisplayToWorld(
      model.renderer,
      callData.position.x,
      callData.position.y,
      worldMousePos[2]
    );
    return mousePos;
  }

  function orientFirstHandleBeforeSecondHandlePlacement(callData) {
    const handle1Origin = model.widgetState.getHandle1().getOrigin();
    const mousePos = computeMousePosition(handle1Origin, callData);
    return computeDirectionWithTwoPoints(handle1Origin, mousePos);
  }

  function orientHandlesWithCompleteWidget(nb) {
    let dir = [0, 0, 0];
    const handle1Origin = model.widgetState.getHandle1().getOrigin();
    const handle2Origin = model.widgetState.getHandle2().getOrigin();
    dir = computeDirectionWithTwoPoints(handle1Origin, handle2Origin);
    if (nb === 2) {
      vtkMath.multiplyScalar(dir, -1);
    }
    return dir;
  }

  function orientHandle(nb, direction) {
    if (
      (nb === 1 && model.widgetState.getHandle1Shape() === 'cone') ||
      (nb === 2 && model.widgetState.getHandle2Shape() === 'cone')
    ) {
      model.representations[nb - 1].getGlyph().setDirection(direction);
    } else {
      model.representations[nb - 1].setOrientation(direction);
    }
  }

  function updateHandleDirection(nb) {
    const direction = orientHandlesWithCompleteWidget(nb);
    orientHandle(nb, direction);
  }

  publicAPI.updateHandleDirections = () => {
    if (isHandleOrientable(model.handle1Shape)) {
      updateHandleDirection(1);
    }
    if (isHandleOrientable(model.handle2Shape)) {
      updateHandleDirection(2);
    }
  };

  publicAPI.toggleHandleVisibility = (bv) => {
    if (bv === 1) {
      if (
        model.widgetState.getHandle1Visibility() === false &&
        handle1.getActive()
      ) {
        model.representations[0].setHandleVisibility(true);
        handleToHide[0] = true;
      }
      if (
        model.widgetState.getHandle2Visibility() === false &&
        handle2.getActive()
      ) {
        model.representations[1].setHandleVisibility(true);
        handleToHide[1] = true;
      }
      return;
    }
    if (handleToHide[0] === true) {
      handleToHide[0] = false;
      model.representations[0].setHandleVisibility(
        model.widgetState.getHandle1Visibility()
      );
    }
    if (handleToHide[1] === true) {
      handleToHide[1] = false;
      model.representations[1].setHandleVisibility(
        model.widgetState.getHandle2Visibility()
      );
    }
  };

  publicAPI.rotateHandlesToFaceCamera = () => {
    if (
      handle1FaceCamera === true &&
      publicAPI.isHandleGlyph2D(model.handle1Shape)
    ) {
      model.representations[0].setViewMatrix(
        Array.from(model.camera.getViewMatrix())
      );
    }
    if (
      handle2FaceCamera === true &&
      publicAPI.isHandleGlyph2D(model.handle2Shape)
    ) {
      model.representations[1].setViewMatrix(
        Array.from(model.camera.getViewMatrix())
      );
    }
  };

  publicAPI.placeHandle = (handle) => {
    const nb = model.nbHandles === 0 ? 1 : 2;
    model.nbHandles = nb;
    handle.setOrigin(...moveHandle.getOrigin());
    handle.setColor(moveHandle.getColor());
    handle.setScale1(moveHandle.getScale1());
    handle.setVisible(true);
    model.widgetState.getText().setText(model.text);
    model.widgetState
      .getText()
      .setOrigin(
        calculateTextPosition(model, model.widgetState.getPositionOnLine())
      );
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
      model.nbHandles === 0
    ) {
      publicAPI.placeHandle(handle1);
      handle2.setOrigin(...moveHandle.getOrigin());
      model.representations[0].setHandleVisibility(handle1Visibility);
    } else if (
      model.activeState === model.widgetState.getMoveHandle() &&
      model.nbHandles === 1
    ) {
      publicAPI.placeHandle(handle2);
      publicAPI.updateHandleDirections();
      calcTextPosWithLineAngle();
      model.representations[1].setHandleVisibility(handle2Visibility);
    } else {
      updateCursor();
    }
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (model.hasFocus && model.nbHandles === MAX_POINTS) {
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
      publicAPI.toggleHandleVisibility(1);
      if (model.nbHandles === 1) {
        moveHandle.setVisible(true);
      }
      if (
        model.activeState === model.widgetState.getMoveHandle() ||
        model.isDragging
      ) {
        model.activeState.setOrigin(worldCoords);
        publicAPI.invokeInteractionEvent();
        if (model.isDragging) {
          updateTextPosition(model, model.widgetState.getPositionOnLine());
          calcTextPosWithLineAngle();
          if (isOrientable()) {
            publicAPI.updateHandleDirections();
          }
        } else if (
          model.nbHandles === 1 &&
          isHandleOrientable(model.handle1Shape)
        ) {
          const direction = orientFirstHandleBeforeSecondHandlePlacement(
            callData
          );
          orientHandle(1, direction);
        }
        return macro.EVENT_ABORT;
      }
    }
    if (model.activeState && !model.activeState.getActive())
      publicAPI.toggleHandleVisibility(0);
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    if (model.isDragging && model.pickable) {
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
    if (
      model.isDragging === false &&
      (!model.activeState || !model.activeState.getActive())
    ) {
      publicAPI.rotateHandlesToFaceCamera();
    }
    model.isDragging = false;
  };

  // --------------------------------------------------------------------------
  // Focus API -  Handle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus && model.nbHandles < MAX_POINTS) {
      model.activeState = moveHandle;
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
