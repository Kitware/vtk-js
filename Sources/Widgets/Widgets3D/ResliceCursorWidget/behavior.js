import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import {
  boundPointOnPlane,
  getAssociatedLinesName,
  rotateVector,
  updateState,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

import {
  ScrollingMethods,
  InteractionMethodsName,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';

export default function widgetBehavior(publicAPI, model) {
  let isDragging = null;
  let isScrolling = false;

  // Reset "updateMethodName" attribute when no actors are selected
  // Useful to update 'updateMethodeName' to the correct name which
  // will be TranslateCenter by default
  publicAPI.resetUpdateMethod = () => {
    if (model.representations.length !== 0) {
      model.representations[0].getSelectedState();
    }
  };

  publicAPI.startScrolling = (newPosition) => {
    if (newPosition) {
      model.previousPosition = newPosition;
    }
    isScrolling = true;
    publicAPI.resetUpdateMethod();
    publicAPI.startInteraction();
  };

  publicAPI.endScrolling = () => {
    isScrolling = false;
    publicAPI.endInteraction();
  };

  publicAPI.updateCursor = () => {
    switch (model.activeState.getUpdateMethodName()) {
      case InteractionMethodsName.TranslateCenter:
        model._apiSpecificRenderWindow.setCursor('move');
        break;
      case InteractionMethodsName.RotateLine:
        model._apiSpecificRenderWindow.setCursor('alias');
        break;
      case InteractionMethodsName.TranslateAxis:
        model._apiSpecificRenderWindow.setCursor('pointer');
        break;
      default:
        model._apiSpecificRenderWindow.setCursor('default');
        break;
    }
  };

  publicAPI.handleLeftButtonPress = (callData) => {
    if (model.activeState && model.activeState.getActive()) {
      isDragging = true;
      const viewType = model.widgetState.getActiveViewType();
      const currentPlaneNormal = model.widgetState.getPlanes()[viewType].normal;
      model.planeManipulator.setWidgetOrigin(model.widgetState.getCenter());
      model.planeManipulator.setWidgetNormal(currentPlaneNormal);

      publicAPI.startInteraction();
    } else if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.LEFT_MOUSE_BUTTON
    ) {
      publicAPI.startScrolling(callData.position);
    } else {
      return macro.VOID;
    }

    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable && model.dragable) {
      return publicAPI.handleEvent(callData);
    }
    if (isScrolling) {
      if (model.previousPosition.y !== callData.position.y) {
        const step = model.previousPosition.y - callData.position.y;
        publicAPI.translateCenterOnCurrentDirection(
          step,
          callData.pokedRenderer
        );
        model.previousPosition = callData.position;

        publicAPI.invokeInternalInteractionEvent();
      }
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging || isScrolling) {
      publicAPI.endScrolling();
    }
    isDragging = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleRightButtonPress = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.RIGHT_MOUSE_BUTTON
    ) {
      publicAPI.startScrolling(calldata.position);
    }
  };

  publicAPI.handleRightButtonRelease = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.RIGHT_MOUSE_BUTTON
    ) {
      publicAPI.endScrolling();
    }
  };

  publicAPI.handleStartMouseWheel = (callData) => {
    publicAPI.resetUpdateMethod();
    publicAPI.startInteraction();
  };

  publicAPI.handleMouseWheel = (calldata) => {
    const step = calldata.spinY;
    isScrolling = true;
    publicAPI.translateCenterOnCurrentDirection(step, calldata.pokedRenderer);

    publicAPI.invokeInternalInteractionEvent();
    isScrolling = false;

    return macro.EVENT_ABORT;
  };

  publicAPI.handleEndMouseWheel = (calldata) => {
    publicAPI.endScrolling();
  };

  publicAPI.handleMiddleButtonPress = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.MIDDLE_MOUSE_BUTTON
    ) {
      publicAPI.startScrolling(calldata.position);
    }
  };

  publicAPI.handleMiddleButtonRelease = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.MIDDLE_MOUSE_BUTTON
    ) {
      publicAPI.endScrolling();
    }
  };

  publicAPI.handleEvent = (callData) => {
    if (model.activeState.getActive()) {
      publicAPI[model.activeState.getUpdateMethodName()](callData);
      publicAPI.invokeInternalInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.invokeInternalInteractionEvent = () => {
    const methodName = model.activeState
      ? model.activeState.getUpdateMethodName()
      : '';
    const computeFocalPointOffset =
      methodName !== InteractionMethodsName.RotateLine;
    const canUpdateFocalPoint =
      methodName === InteractionMethodsName.RotateLine;
    publicAPI.invokeInteractionEvent({
      computeFocalPointOffset,
      canUpdateFocalPoint,
    });
  };

  publicAPI.startInteraction = () => {
    publicAPI.invokeStartInteractionEvent();
    // When interacting, plane actor and lines must be re-rendered on other views
    publicAPI.getViewWidgets().forEach((viewWidget) => {
      viewWidget.getInteractor().requestAnimation(publicAPI);
    });
  };

  publicAPI.endInteraction = () => {
    publicAPI.invokeEndInteractionEvent();
    publicAPI.getViewWidgets().forEach((viewWidget) => {
      viewWidget.getInteractor().cancelAnimation(publicAPI);
    });
  };

  publicAPI.translateCenterOnCurrentDirection = (nbSteps, renderer) => {
    const dirProj = renderer
      .getRenderWindow()
      .getRenderers()[0]
      .getActiveCamera()
      .getDirectionOfProjection();

    // Direction of the projection is the inverse of what we want
    const direction = vtkMath.multiplyScalar(dirProj, -1);

    const oldCenter = model.widgetState.getCenter();
    const image = model.widgetState.getImage();
    const imageSpacing = image.getSpacing();

    // Use Chebyshev norm
    // https://math.stackexchange.com/questions/71423/what-is-the-term-for-the-projection-of-a-vector-onto-the-unit-cube
    const absDirProj = dirProj.map((value) => Math.abs(value));
    const index = absDirProj.indexOf(Math.max(...absDirProj));
    const movingFactor = nbSteps * (imageSpacing[index] / dirProj[index]);

    // Define the potentially new center
    let newCenter = [
      oldCenter[0] + movingFactor * direction[0],
      oldCenter[1] + movingFactor * direction[1],
      oldCenter[2] + movingFactor * direction[2],
    ];
    newCenter = publicAPI.getBoundedCenter(newCenter);

    model.widgetState.setCenter(newCenter);
    updateState(model.widgetState);
  };

  publicAPI[InteractionMethodsName.TranslateAxis] = (calldata) => {
    const stateLine = model.widgetState.getActiveLineState();
    const worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model._apiSpecificRenderWindow
    );

    const point1 = stateLine.getPoint1();
    const point2 = stateLine.getPoint2();

    // Translate the current line along the other line
    const otherLineName = getAssociatedLinesName(stateLine.getName());
    const otherLine = model.widgetState[`get${otherLineName}`]();
    const otherLineVector = vtkMath.subtract(
      otherLine.getPoint2(),
      otherLine.getPoint1(),
      []
    );
    vtkMath.normalize(otherLineVector);
    const axisTranslation = otherLineVector;

    const currentLineVector = vtkMath.subtract(point2, point1, [0, 0, 0]);
    vtkMath.normalize(currentLineVector);

    const dot = vtkMath.dot(currentLineVector, otherLineVector);
    // lines are colinear, translate along perpendicular axis from current line
    if (dot === 1 || dot === -1) {
      vtkMath.cross(
        currentLineVector,
        model.planeManipulator.getWidgetNormal(),
        axisTranslation
      );
    }

    const closestPoint = [];
    vtkLine.distanceToLine(worldCoords, point1, point2, closestPoint);

    const translationVector = vtkMath.subtract(worldCoords, closestPoint, []);
    const translationDistance = vtkMath.dot(translationVector, axisTranslation);

    const center = model.widgetState.getCenter();
    let newOrigin = vtkMath.multiplyAccumulate(
      center,
      axisTranslation,
      translationDistance,
      [0, 0, 0]
    );
    newOrigin = publicAPI.getBoundedCenter(newOrigin);
    model.widgetState.setCenter(newOrigin);
    updateState(model.widgetState);
  };

  publicAPI.getBoundedCenter = (newCenter) => {
    const oldCenter = model.widgetState.getCenter();
    const imageBounds = model.widgetState.getImage().getBounds();

    if (vtkBoundingBox.containsPoint(imageBounds, ...newCenter)) {
      return newCenter;
    }

    return boundPointOnPlane(newCenter, oldCenter, imageBounds);
  };

  publicAPI[InteractionMethodsName.TranslateCenter] = (calldata) => {
    let worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model._apiSpecificRenderWindow
    );
    worldCoords = publicAPI.getBoundedCenter(worldCoords);
    model.activeState.setCenter(worldCoords);
    updateState(model.widgetState);
  };

  publicAPI[InteractionMethodsName.RotateLine] = (calldata) => {
    const activeLine = model.widgetState.getActiveLineState();
    const planeNormal = model.planeManipulator.getWidgetNormal();
    const worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model._apiSpecificRenderWindow
    );

    const center = model.widgetState.getCenter();
    const previousLineDirection = vtkMath.subtract(
      activeLine.getPoint1(),
      activeLine.getPoint2(),
      []
    );
    vtkMath.normalize(previousLineDirection);
    if (model.widgetState.getActiveRotationPointName() === 'point1') {
      vtkMath.multiplyScalar(previousLineDirection, -1);
    }

    const currentVectorToOrigin = [0, 0, 0];
    vtkMath.subtract(worldCoords, center, currentVectorToOrigin);
    vtkMath.normalize(currentVectorToOrigin);

    const radianAngle = vtkMath.signedAngleBetweenVectors(
      previousLineDirection,
      currentVectorToOrigin,
      planeNormal
    );

    publicAPI.rotateLineInView(activeLine, radianAngle);
  };

  /**
   * Rotate a line by a specified angle
   * @param {Line} line The line to rotate (e.g. getActiveLineState())
   * @param {Number} radianAngle Applied angle in radian
   */
  publicAPI.rotateLineInView = (line, radianAngle) => {
    const viewType = line.getViewType();
    const inViewType = line.getInViewType();
    const planeNormal = model.widgetState.getPlanes()[inViewType].normal;
    publicAPI.rotatePlane(viewType, radianAngle, planeNormal);

    if (model.widgetState.getKeepOrthogonality()) {
      const associatedLineName = getAssociatedLinesName(line.getName());
      const associatedLine = model.widgetState[`get${associatedLineName}`]();
      const associatedViewType = associatedLine.getViewType();
      publicAPI.rotatePlane(associatedViewType, radianAngle, planeNormal);
    }
    updateState(model.widgetState);
  };

  /**
   * Rotate a specified plane around an other specified plane.
   * @param {ViewTypes} viewType Define which plane will be rotated
   * @param {Number} radianAngle Applied angle in radian
   * @param {vec3} planeNormal Define the axis to rotate around
   */
  publicAPI.rotatePlane = (viewType, radianAngle, planeNormal) => {
    const { normal, viewUp } = model.widgetState.getPlanes()[viewType];
    const newNormal = rotateVector(normal, planeNormal, radianAngle);
    const newViewUp = rotateVector(viewUp, planeNormal, radianAngle);

    model.widgetState.getPlanes()[viewType] = {
      normal: newNormal,
      viewUp: newViewUp,
    };
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.planeManipulator = vtkPlaneManipulator.newInstance();
}
