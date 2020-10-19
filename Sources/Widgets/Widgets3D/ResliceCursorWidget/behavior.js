import { mat4 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlaneManipulator from 'vtk.js/Sources/Widgets/Manipulators/PlaneManipulator';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import {
  getAssociatedLinesName,
  updateState,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

export default function widgetBehavior(publicAPI, model) {
  let isDragging = null;

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
    if (!model.activeState || !model.activeState.getActive()) {
      return macro.VOID;
    }
    isDragging = true;
    const viewName = model.widgetState.getActiveViewName();
    const currentPlaneNormal = model.widgetState[`get${viewName}PlaneNormal`]();
    model.planeManipulator.setOrigin(model.widgetState.getCenter());
    model.planeManipulator.setNormal(currentPlaneNormal);

    publicAPI.invokeStartInteractionEvent();

    // When interacting, plane actor and lines must be re-rendered on other views
    publicAPI.getViewWidgets().forEach((viewWidget) => {
      viewWidget.getInteractor().requestAnimation(publicAPI);
    });

    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (callData) => {
    if (isDragging && model.pickable) {
      return publicAPI.handleEvent(callData);
    }
    return macro.VOID;
  };

  publicAPI.handleLeftButtonRelease = () => {
    if (isDragging) {
      publicAPI.invokeEndInteractionEvent();
      publicAPI.getViewWidgets().forEach((viewWidget) => {
        viewWidget.getInteractor().cancelAnimation(publicAPI);
      });
    }
    isDragging = false;
    model.widgetState.deactivate();
  };

  publicAPI.handleEvent = (callData) => {
    if (model.activeState.getActive()) {
      publicAPI[model.activeState.getUpdateMethodName()](callData);
      publicAPI.invokeInteractionEvent();
      return macro.EVENT_ABORT;
    }
    return macro.VOID;
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
    const newOrigin = vtkMath.multiplyAccumulate(
      center,
      axisTranslation,
      translationDistance,
      [0, 0, 0]
    );
    model.widgetState.setCenter(newOrigin);
    updateState(model.widgetState);
  };

  publicAPI.translateCenter = (calldata) => {
    const worldCoords = model.planeManipulator.handleEvent(
      calldata,
      model.openGLRenderWindow
    );

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
