import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import {
  boundPointOnPlane,
  getAssociatedLinesName,
  updateState,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

import { ScrollingMethods } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants';

export default function widgetBehavior(publicAPI, model) {
  let isDragging = null;
  let isScrolling = false;

  publicAPI.updateCursor = () => {
    switch (model.activeState.getUpdateMethodName()) {
      case 'translateCenter':
        model.openGLRenderWindow.setCursor('move');
        break;
      case 'rotateLine':
        model.openGLRenderWindow.setCursor('alias');
        break;
      case 'translateAxis':
        model.openGLRenderWindow.setCursor('pointer');
        break;
      default:
        model.openGLRenderWindow.setCursor('default');
        break;
    }
  };

  publicAPI.handleLeftButtonPress = (callData) => {
    if (model.activeState && model.activeState.getActive()) {
      isDragging = true;
      const viewName = model.widgetState.getActiveViewName();
      const currentPlaneNormal = model.widgetState[
        `get${viewName}PlaneNormal`
      ]();
      model.planeManipulator.setOrigin(model.widgetState.getCenter());
      model.planeManipulator.setNormal(currentPlaneNormal);

      publicAPI.startInteraction();
    } else if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.LEFT_MOUSE_BUTTON
    ) {
      isScrolling = true;
      model.previousPosition = callData.position;
      publicAPI.startInteraction();
    } else {
      return macro.VOID;
    }

    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable) {
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

        publicAPI.invokeInteractionEvent();
      }
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging || isScrolling) {
      publicAPI.endInteraction();
    }
    isDragging = false;
    isScrolling = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleRightButtonPress = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.RIGHT_MOUSE_BUTTON
    ) {
      model.previousPosition = calldata.position;
      isScrolling = true;
      publicAPI.startInteraction();
    }
  };

  publicAPI.handleRightButtonRelease = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.RIGHT_MOUSE_BUTTON
    ) {
      isScrolling = false;
      publicAPI.endInteraction();
    }
  };

  publicAPI.handleStartMouseWheel = (callData) => {
    publicAPI.startInteraction();
  };

  publicAPI.handleMouseWheel = (calldata) => {
    const step = calldata.spinY;
    publicAPI.translateCenterOnCurrentDirection(step, calldata.pokedRenderer);

    publicAPI.invokeInteractionEvent();

    return macro.EVENT_ABORT;
  };

  publicAPI.handleEndMouseWheel = (calldata) => {
    publicAPI.endInteraction();
  };

  publicAPI.handleMiddleButtonPress = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.MIDDLE_MOUSE_BUTTON
    ) {
      isScrolling = true;
      model.previousPosition = calldata.position;
      publicAPI.startInteraction();
    }
  };

  publicAPI.handleMiddleButtonRelease = (calldata) => {
    if (
      model.widgetState.getScrollingMethod() ===
      ScrollingMethods.MIDDLE_MOUSE_BUTTON
    ) {
      isScrolling = false;
      publicAPI.endInteraction();
    }
  };

  publicAPI.handleEvent = (callData) => {
    if (model.activeState.getActive()) {
      publicAPI[model.activeState.getUpdateMethodName()](callData);
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
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

    // Define the potentially new center
    let newCenter = [
      oldCenter[0] + nbSteps * direction[0] * imageSpacing[0],
      oldCenter[1] + nbSteps * direction[1] * imageSpacing[1],
      oldCenter[2] + nbSteps * direction[2] * imageSpacing[2],
    ];
    newCenter = publicAPI.getBoundedCenter(newCenter);

    model.widgetState.setCenter(newCenter);
    updateState(model.widgetState);
  };

  publicAPI.translateAxis = (calldata) => {
    const stateLine = model.widgetState.getActiveLineState();
    const worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model.openGLRenderWindow
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
        model.planeManipulator.getNormal(),
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
    const bounds = vtkBoundingBox.newInstance({ bounds: imageBounds });

    if (bounds.containsPoint(...newCenter)) {
      return newCenter;
    }

    return boundPointOnPlane(newCenter, oldCenter, imageBounds);
  };

  publicAPI.translateCenter = (calldata) => {
    let worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model.openGLRenderWindow
    );
    worldCoords = publicAPI.getBoundedCenter(worldCoords);
    model.activeState.setCenter(worldCoords);
    updateState(model.widgetState);
  };

  publicAPI.rotateLine = (calldata) => {
    const activeLine = model.widgetState.getActiveLineState();
    const planeNormal = model.planeManipulator.getNormal();
    const worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model.openGLRenderWindow
    );

    const center = model.widgetState.getCenter();
    const previousWorldPosition = activeLine[
      `get${model.widgetState.getActiveRotationPointName()}`
    ]();

    const previousVectorToOrigin = [0, 0, 0];
    vtkMath.subtract(previousWorldPosition, center, previousVectorToOrigin);
    vtkMath.normalize(previousVectorToOrigin);

    const currentVectorToOrigin = [0, 0, 0];
    vtkMath.subtract(worldCoords, center, currentVectorToOrigin);
    vtkMath.normalize(currentVectorToOrigin);

    const rotationAngle = vtkMath.angleBetweenVectors(
      previousVectorToOrigin,
      currentVectorToOrigin
    );

    // Define the direction of the rotation
    const cross = [0, 0, 0];
    vtkMath.cross(currentVectorToOrigin, previousVectorToOrigin, cross);
    vtkMath.normalize(cross);

    const sign = vtkMath.dot(cross, planeNormal) > 0 ? -1 : 1;

    const matrix = mat4.create();
    mat4.translate(matrix, matrix, center);
    mat4.rotate(matrix, matrix, rotationAngle * sign, planeNormal);
    mat4.translate(matrix, matrix, [-center[0], -center[1], -center[2]]);

    // Rotate associated line's plane normal
    const planeName = activeLine.getPlaneName();
    const normal = model.widgetState[`get${planeName}PlaneNormal`]();
    const newNormal = vtkMath.rotateVector(
      normal,
      planeNormal,
      rotationAngle * sign
    );
    model.widgetState[`set${planeName}PlaneNormal`](newNormal);

    if (model.widgetState.getKeepOrthogonality()) {
      const associatedLineName = getAssociatedLinesName(activeLine.getName());
      const associatedLine = model.widgetState[`get${associatedLineName}`]();
      const planeName2 = associatedLine.getPlaneName();
      const normal2 = model.widgetState[`get${planeName2}PlaneNormal`]();
      const newNormal2 = vtkMath.rotateVector(
        normal2,
        planeNormal,
        rotationAngle * sign
      );
      model.widgetState[`set${planeName2}PlaneNormal`](newNormal2);
    }
    updateState(model.widgetState);
  };

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  model.planeManipulator = vtkPlaneManipulator.newInstance();
}
