import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import {
  boundPointOnPlane,
  rotateVector,
  updateState,
  getOtherLineName,
  getLinePlaneName,
  getLineInPlaneName,
  getLineNames,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

import {
  ScrollingMethods,
  InteractionMethodsName,
  planeNameToViewType,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';

export default function widgetBehavior(publicAPI, model) {
  model._isDragging = false;
  let isScrolling = false;
  let previousPosition;

  macro.setGet(publicAPI, model, ['keepOrthogonality']);

  publicAPI.setEnableTranslation = (enable) => {
    model.representations[0].setPickable(enable); // line handle
    model.representations[2].setPickable(enable); // center handle
  };

  publicAPI.setEnableRotation = (enable) => {
    model.representations[1].setPickable(enable); // rotation handle
  };

  // FIXME: label information should be accessible from activeState instead of parent state.
  publicAPI.getActiveInteraction = () => {
    if (
      model.widgetState
        .getStatesWithLabel('rotation')
        .includes(model.activeState)
    ) {
      return InteractionMethodsName.RotateLine;
    }
    if (
      model.widgetState.getStatesWithLabel('line').includes(model.activeState)
    ) {
      return InteractionMethodsName.TranslateAxis;
    }
    if (
      model.widgetState.getStatesWithLabel('center').includes(model.activeState)
    ) {
      return InteractionMethodsName.TranslateCenter;
    }
    return null;
  };

  /**
   * ActiveState can be RotationHandle or a LineHandle
   * @returns 'YinX', 'ZinX', 'XinY', 'ZinY', 'XinZ' or 'YinZ'
   */
  publicAPI.getActiveLineName = () =>
    getLineNames(model.widgetState).find((lineName) =>
      model.widgetState.getStatesWithLabel(lineName).includes(model.activeState)
    );

  // FIXME: label information should be accessible from activeState instead of parent state.
  publicAPI.getActiveLineHandle = () =>
    model.widgetState[`getAxis${publicAPI.getActiveLineName()}`]?.();

  /**
   * Return the line handle of the other line in the same view.
   * @param {string} lineName name of the line (YinX, ZinX, XinY, ZinY, XinZ, YinZ)
   * @returns ZinX if lineName == YinX, YinX if lineName == ZinX, ZinY if lineName == XinY...
   */
  publicAPI.getOtherLineHandle = (lineName) =>
    model.widgetState[
      `getAxis${getOtherLineName(model.widgetState, lineName)}`
    ]?.();

  // FIXME: label information should be accessible from activeState instead of parent state.
  /**
   * There are 2 rotation handles per axis: 'point0' and 'point1'.
   * This function returns which rotation handle (point0 or point1) is currently active.
   * ActiveState must be a RotationHandle.
   * @returns 'point0', 'point1' or null if no point is active (e.g. line is being rotated)
   */
  publicAPI.getActiveRotationPointName = () => {
    if (
      model.widgetState.getStatesWithLabel('point0').includes(model.activeState)
    ) {
      return 'point0';
    }
    if (
      model.widgetState.getStatesWithLabel('point1').includes(model.activeState)
    ) {
      return 'point1';
    }
    return null;
  };

  publicAPI.startScrolling = (newPosition) => {
    if (newPosition) {
      previousPosition = newPosition;
    }
    isScrolling = true;
    publicAPI.startInteraction();
  };

  publicAPI.endScrolling = () => {
    isScrolling = false;
    publicAPI.endInteraction();
  };

  publicAPI.updateCursor = () => {
    switch (publicAPI.getActiveInteraction()) {
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
      model._isDragging = true;
      const viewType = model.viewType;
      const currentPlaneNormal = model.widgetState.getPlanes()[viewType].normal;
      const manipulator =
        model.activeState?.getManipulator?.() ?? model.manipulator;
      manipulator.setWidgetOrigin(model.widgetState.getCenter());
      manipulator.setWidgetNormal(currentPlaneNormal);
      const { worldCoords } = manipulator.handleEvent(
        callData,
        model._apiSpecificRenderWindow
      );
      previousPosition = worldCoords;

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
    if (model._isDragging) {
      return publicAPI.handleEvent(callData);
    }
    if (isScrolling) {
      if (previousPosition.y !== callData.position.y) {
        const step = previousPosition.y - callData.position.y;
        publicAPI.translateCenterOnPlaneDirection(step);
        previousPosition = callData.position;

        publicAPI.invokeInternalInteractionEvent();
      }
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (model._isDragging || isScrolling) {
      publicAPI.endScrolling();
    }
    model._isDragging = false;
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

  publicAPI.handleRightButtonRelease = () => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.RIGHT_MOUSE_BUTTON
    ) {
      publicAPI.endScrolling();
    }
  };

  publicAPI.handleStartMouseWheel = () => {
    publicAPI.startInteraction();
  };

  publicAPI.handleMouseWheel = (calldata) => {
    const step = calldata.spinY;
    isScrolling = true;
    publicAPI.translateCenterOnPlaneDirection(step);

    publicAPI.invokeInternalInteractionEvent();
    isScrolling = false;

    return macro.EVENT_ABORT;
  };

  publicAPI.handleEndMouseWheel = () => {
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

  publicAPI.handleMiddleButtonRelease = () => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.MIDDLE_MOUSE_BUTTON
    ) {
      publicAPI.endScrolling();
    }
  };

  publicAPI.handleEvent = (callData) => {
    if (model.activeState.getActive()) {
      publicAPI[publicAPI.getActiveInteraction()](callData);
      publicAPI.invokeInternalInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
  };

  publicAPI.invokeInternalInteractionEvent = () => {
    const methodName = publicAPI.getActiveInteraction();
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

  publicAPI.translateCenterOnPlaneDirection = (nbSteps) => {
    const dirProj = model.widgetState.getPlanes()[model.viewType].normal;

    const oldCenter = model.widgetState.getCenter();
    const image = model.widgetState.getImage();
    const imageSpacing = image.getSpacing();

    // Use Chebyshev norm
    // https://math.stackexchange.com/questions/71423/what-is-the-term-for-the-projection-of-a-vector-onto-the-unit-cube
    const absDirProj = dirProj.map((value) => Math.abs(value));
    const index = absDirProj.indexOf(Math.max(...absDirProj));
    const movingFactor =
      (nbSteps * imageSpacing[index]) / Math.abs(dirProj[index]);

    // Define the potentially new center
    let newCenter = [
      oldCenter[0] + movingFactor * dirProj[0],
      oldCenter[1] + movingFactor * dirProj[1],
      oldCenter[2] + movingFactor * dirProj[2],
    ];
    newCenter = publicAPI.getBoundedCenter(newCenter);

    model.widgetState.setCenter(newCenter);
    updateState(
      model.widgetState,
      model._factory.getScaleInPixels(),
      model._factory.getRotationHandlePosition()
    );
  };

  publicAPI[InteractionMethodsName.TranslateAxis] = (calldata) => {
    const lineHandle = publicAPI.getActiveLineHandle();
    const lineName = publicAPI.getActiveLineName();
    const pointOnLine = vtkMath.add(
      lineHandle.getOrigin(),
      lineHandle.getDirection(),
      []
    );
    const currentLineVector = lineHandle.getDirection();
    vtkMath.normalize(currentLineVector);

    // Translate the current line along the other line
    const otherLineHandle = publicAPI.getOtherLineHandle(lineName);
    const center = model.widgetState.getCenter();
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    let worldCoords = null;
    let newOrigin = [];
    if (model.activeState?.getManipulator?.()) {
      worldCoords = manipulator.handleEvent(
        calldata,
        model._apiSpecificRenderWindow
      ).worldCoords;
      const translation = vtkMath.subtract(worldCoords, previousPosition, []);
      vtkMath.add(center, translation, newOrigin);
    } else if (otherLineHandle) {
      const otherLineVector = otherLineHandle.getDirection();
      vtkMath.normalize(otherLineVector);
      const axisTranslation = otherLineVector;

      const dot = vtkMath.dot(currentLineVector, otherLineVector);
      // lines are colinear, translate along perpendicular axis from current line
      if (dot === 1 || dot === -1) {
        vtkMath.cross(
          currentLineVector,
          manipulator.getWidgetNormal(),
          axisTranslation
        );
      }

      const closestPoint = [];
      worldCoords = manipulator.handleEvent(
        calldata,
        model._apiSpecificRenderWindow
      ).worldCoords;
      vtkLine.distanceToLine(
        worldCoords,
        lineHandle.getOrigin(),
        pointOnLine,
        closestPoint
      );

      const translationVector = vtkMath.subtract(worldCoords, closestPoint, []);
      const translationDistance = vtkMath.dot(
        translationVector,
        axisTranslation
      );

      newOrigin = vtkMath.multiplyAccumulate(
        center,
        axisTranslation,
        translationDistance,
        newOrigin
      );
    }
    newOrigin = publicAPI.getBoundedCenter(newOrigin);
    model.widgetState.setCenter(newOrigin);
    updateState(
      model.widgetState,
      model._factory.getScaleInPixels(),
      model._factory.getRotationHandlePosition()
    );
    previousPosition = worldCoords;
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
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    const { worldCoords } = manipulator.handleEvent(
      calldata,
      model._apiSpecificRenderWindow
    );
    const translation = vtkMath.subtract(worldCoords, previousPosition, []);
    previousPosition = worldCoords;
    let newCenter = vtkMath.add(model.widgetState.getCenter(), translation, []);
    newCenter = publicAPI.getBoundedCenter(newCenter);
    model.widgetState.setCenter(newCenter);
    updateState(
      model.widgetState,
      model._factory.getScaleInPixels(),
      model._factory.getRotationHandlePosition()
    );
  };

  publicAPI[InteractionMethodsName.RotateLine] = (calldata) => {
    const activeLineHandle = publicAPI.getActiveLineHandle();
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    const planeNormal = manipulator.getWidgetNormal();
    const { worldCoords } = manipulator.handleEvent(
      calldata,
      model._apiSpecificRenderWindow
    );

    const center = model.widgetState.getCenter();
    const currentVectorToOrigin = [0, 0, 0];
    vtkMath.subtract(worldCoords, center, currentVectorToOrigin);
    vtkMath.normalize(currentVectorToOrigin);

    const previousLineDirection = activeLineHandle.getDirection();
    vtkMath.normalize(previousLineDirection);
    const activePointName = publicAPI.getActiveRotationPointName();
    if (
      activePointName === 'point1' ||
      (!activePointName &&
        vtkMath.dot(currentVectorToOrigin, previousLineDirection) < 0)
    ) {
      vtkMath.multiplyScalar(previousLineDirection, -1);
    }

    const radianAngle = vtkMath.signedAngleBetweenVectors(
      previousLineDirection,
      currentVectorToOrigin,
      planeNormal
    );

    publicAPI.rotateLineInView(publicAPI.getActiveLineName(), radianAngle);
  };

  /**
   * Rotate a line by a specified angle
   * @param {string} lineName The line name to rotate (e.g. YinX, ZinX, XinY, ZinY, XinZ, YinZ)
   * @param {Number} radianAngle Applied angle in radian
   */
  publicAPI.rotateLineInView = (lineName, radianAngle) => {
    const viewType = planeNameToViewType[getLinePlaneName(lineName)];
    const inViewType = planeNameToViewType[getLineInPlaneName(lineName)];
    const planeNormal = model.widgetState.getPlanes()[inViewType].normal;
    publicAPI.rotatePlane(viewType, radianAngle, planeNormal);

    if (publicAPI.getKeepOrthogonality()) {
      const otherLineName = getOtherLineName(model.widgetState, lineName);
      const otherPlaneName = getLinePlaneName(otherLineName);
      publicAPI.rotatePlane(
        planeNameToViewType[otherPlaneName],
        radianAngle,
        planeNormal
      );
    }
    updateState(
      model.widgetState,
      model._factory.getScaleInPixels(),
      model._factory.getRotationHandlePosition()
    );
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
}
