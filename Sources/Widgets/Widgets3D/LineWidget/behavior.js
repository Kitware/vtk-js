import Constants from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/Constants';
import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math/';
import {
  calculateTextPosition,
  updateTextPosition,
  getNumberOfPlacedHandles,
  isHandlePlaced,
  getPoint,
} from 'vtk.js/Sources/Widgets/Widgets3D/LineWidget/helpers';

const { ShapeType } = Constants;
// Total number of points to place
const MAX_POINTS = 2;

const handleGetters = ['getHandle1', 'getHandle2', 'getMoveHandle'];

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkLineWidgetProp');

  /**
   * Returns the handle at the handleIndex'th index.
   * @param {number} handleIndex 0, 1 or 2
   */
  publicAPI.getHandle = (handleIndex) =>
    model.widgetState[handleGetters[handleIndex]]();

  publicAPI.isPlaced = () =>
    getNumberOfPlacedHandles(model.widgetState) === MAX_POINTS;

  // --------------------------------------------------------------------------
  // Interactor event
  // --------------------------------------------------------------------------

  function ignoreKey(e) {
    return e.altKey || e.controlKey || e.shiftKey;
  }

  function updateCursor(callData) {
    model.isDragging = true;
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    model.previousPosition = [
      ...manipulator.handleEvent(callData, model._apiSpecificRenderWindow),
    ];
    model._apiSpecificRenderWindow.setCursor('grabbing');
    model._interactor.requestAnimation(publicAPI);
  }

  // --------------------------------------------------------------------------
  // Text methods
  // --------------------------------------------------------------------------

  /**
   * check for handle 2 position in comparison to handle 1 position
   * and sets text offset to not overlap on the line representation
   */

  function getOffsetDirectionForTextPosition() {
    const pos1 = publicAPI.getHandle(0).getOrigin();
    const pos2 = publicAPI.getHandle(1).getOrigin();

    let dySign = 1;

    if (pos1 && pos2) {
      if (pos1[0] <= pos2[0]) {
        dySign = pos1[1] <= pos2[1] ? 1 : -1;
      } else {
        dySign = pos1[1] <= pos2[1] ? -1 : 1;
      }
    }
    return dySign;
  }

  /**
   * place SVGText on line according to both handle positions
   * which purpose is to never have text representation overlapping
   * on PolyLine representation
   * */
  publicAPI.placeText = () => {
    const dySign = getOffsetDirectionForTextPosition();
    const textPropsCp = { ...model.representations[3].getTextProps() };
    textPropsCp.dy = dySign * Math.abs(textPropsCp.dy);
    model.representations[3].setTextProps(textPropsCp);
    model._interactor.render();
  };

  publicAPI.setText = (text) => {
    model.widgetState.getText().setText(text);
    model._interactor.render();
  };

  // --------------------------------------------------------------------------
  // Handle positioning methods
  // --------------------------------------------------------------------------

  // Handle utilities ---------------------------------------------------------

  function getLineDirection(p1, p2) {
    const dir = vtkMath.subtract(p1, p2, []);
    vtkMath.normalize(dir);
    return dir;
  }

  // Handle orientation & rotation ---------------------------------------------------------

  function computeMousePosition(p1, callData) {
    const displayMousePos = publicAPI.computeWorldToDisplay(
      model._renderer,
      ...p1
    );
    const worldMousePos = publicAPI.computeDisplayToWorld(
      model._renderer,
      callData.position.x,
      callData.position.y,
      displayMousePos[2]
    );
    return worldMousePos;
  }

  /**
   * Returns the  handle orientation to match the direction vector of the polyLine from one tip to another
   * @param {number} handleIndex 0 for handle1, 1 for handle2
   * @param {object} callData if specified, uses mouse position as 2nd point
   */
  function getHandleOrientation(handleIndex, callData = null) {
    const point1 = getPoint(handleIndex, model.widgetState);
    const point2 = callData
      ? computeMousePosition(point1, callData)
      : getPoint(1 - handleIndex, model.widgetState);
    return point1 && point2 ? getLineDirection(point1, point2) : null;
  }

  /**
   * Orient handle
   * @param {number} handleIndex 0, 1 or 2
   * @param {object} callData optional, see getHandleOrientation for details.
   */
  function updateHandleOrientation(handleIndex, callData = null) {
    const orientation = getHandleOrientation(Math.min(1, handleIndex));
    model.representations[handleIndex].setOrientation(orientation);
  }

  publicAPI.updateHandleOrientations = () => {
    updateHandleOrientation(0);
    updateHandleOrientation(1);
    updateHandleOrientation(2);
  };

  publicAPI.rotateHandlesToFaceCamera = () => {
    model.representations[0].setViewMatrix(
      Array.from(model._camera.getViewMatrix())
    );
    model.representations[1].setViewMatrix(
      Array.from(model._camera.getViewMatrix())
    );
  };

  // Handles visibility ---------------------------------------------------------

  publicAPI.setMoveHandleVisibility = (visibility) => {
    model.representations[2].setVisibilityFlagArray([visibility, visibility]);
    model.widgetState.getMoveHandle().setVisible(visibility);
    model.representations[2].updateActorVisibility();
  };

  /**
   * Set actor visibility to true unless it is a NONE handle
   * and uses state visibility variable for the displayActor visibility to
   * allow pickable handles even when they are not displayed on screen
   * @param handle : the handle state object
   * @param handleNb : the handle number according to its label in widget state
   */
  publicAPI.updateHandleVisibility = (handleIndex) => {
    const handle = publicAPI.getHandle(handleIndex);
    const visibility =
      handle.getVisible() && isHandlePlaced(handleIndex, model.widgetState);
    model.representations[handleIndex].setVisibilityFlagArray([
      visibility,
      visibility && handle.getShape() !== ShapeType.NONE,
    ]);
    model.representations[handleIndex].updateActorVisibility();
    model._interactor.render();
  };

  /**
   * Called when placing a point from the first time.
   * @param {number} handleIndex
   */
  publicAPI.placeHandle = (handleIndex) => {
    const handle = publicAPI.getHandle(handleIndex);
    handle.setOrigin(...model.widgetState.getMoveHandle().getOrigin());

    publicAPI.updateHandleOrientations();
    publicAPI.rotateHandlesToFaceCamera();
    model.widgetState.getText().setOrigin(calculateTextPosition(model));
    publicAPI.updateHandleVisibility(handleIndex);

    if (handleIndex === 0) {
      // For the line (handle1, handle2, moveHandle) to be displayed
      // correctly, handle2 origin must be valid.
      publicAPI
        .getHandle(1)
        .setOrigin(...model.widgetState.getMoveHandle().getOrigin());
      // Now that handle2 has a valid origin, hide it
      publicAPI.updateHandleVisibility(1);

      model.widgetState
        .getMoveHandle()
        .setShape(publicAPI.getHandle(1).getShape());
    }
    if (handleIndex === 1) {
      publicAPI.placeText();
      publicAPI.setMoveHandleVisibility(false);
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
    if (
      model.activeState === model.widgetState.getMoveHandle() &&
      getNumberOfPlacedHandles(model.widgetState) === 0
    ) {
      publicAPI.placeHandle(0);
    } else if (
      model.widgetState.getMoveHandle().getActive() &&
      getNumberOfPlacedHandles(model.widgetState) === 1
    ) {
      publicAPI.placeHandle(1);
    } else if (!model.widgetState.getText().getActive()) {
      // Grab handle1, handle2 or whole widget
      updateCursor(e);
    }
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Mouse move: Drag selected handle / Handle follow the mouse
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (model.hasFocus && publicAPI.isPlaced() && !model.isDragging) {
      publicAPI.loseFocus();
      return macro.VOID;
    }
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    if (
      manipulator &&
      model.pickable &&
      model.dragable &&
      model.activeState &&
      model.activeState.getActive() &&
      !ignoreKey(callData)
    ) {
      const worldCoords = manipulator.handleEvent(
        callData,
        model._apiSpecificRenderWindow
      );
      const translation = model.previousPosition
        ? vtkMath.subtract(worldCoords, model.previousPosition, [])
        : [0, 0, 0];
      model.previousPosition = worldCoords;
      if (
        // is placing first or second handle
        model.activeState === model.widgetState.getMoveHandle() ||
        // is dragging already placed first or second handle
        model.isDragging
      ) {
        if (model.activeState.setOrigin) {
          model.activeState.setOrigin(worldCoords);
        } else {
          // Dragging line
          publicAPI
            .getHandle(0)
            .setOrigin(
              vtkMath.add(publicAPI.getHandle(0).getOrigin(), translation, [])
            );
          publicAPI
            .getHandle(1)
            .setOrigin(
              vtkMath.add(publicAPI.getHandle(1).getOrigin(), translation, [])
            );
        }
        publicAPI.updateHandleOrientations();
        updateTextPosition(model);
        publicAPI.invokeInteractionEvent();
        return macro.EVENT_ABORT;
      }
    }
    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left release: Finish drag / Create new handle
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = () => {
    // After dragging a point or placing all points
    if (
      model.activeState &&
      model.activeState.getActive() &&
      (model.isDragging || publicAPI.isPlaced())
    ) {
      const wasTextActive = model.widgetState.getText().getActive();
      // Recompute offsets
      publicAPI.placeText();
      model.widgetState.deactivate();
      model.widgetState.getMoveHandle().deactivate();
      model.activeState = null;

      if (!wasTextActive) {
        model._interactor.cancelAnimation(publicAPI);
      }
      model._apiSpecificRenderWindow.setCursor('pointer');

      model.hasFocus = false;

      publicAPI.invokeEndInteractionEvent();
      model._widgetManager.enablePicking();
      model._interactor.render();
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
  // Focus API - moveHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus && !publicAPI.isPlaced()) {
      model.activeState = model.widgetState.getMoveHandle();
      model.activeState.setShape(publicAPI.getHandle(0).getShape());
      publicAPI.setMoveHandleVisibility(true);
      model.activeState.activate();
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
    model.activeState = null;
    model.hasFocus = false;
    model._widgetManager.enablePicking();
    model._interactor.render();
  };
}
