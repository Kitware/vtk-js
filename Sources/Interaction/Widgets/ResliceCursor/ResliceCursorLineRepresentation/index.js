import macro from 'vtk.js/Sources/macros';

import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkResliceCursorActor from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorActor';
import vtkResliceCursorRepresentation from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorRepresentation';

import { InteractionState } from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursorRepresentation/Constants';

// ----------------------------------------------------------------------------
// ResliceCursorLineRepresentation methods
// ----------------------------------------------------------------------------
function isAxisPicked(renderer, tolerance, axisPolyData, pickedPosition) {
  const points = axisPolyData.getPoints();

  const worldP1 = [];
  points.getPoint(0, worldP1);

  const displayP1 = vtkInteractorObserver.computeWorldToDisplay(
    renderer,
    worldP1[0],
    worldP1[1],
    worldP1[2]
  );

  const worldP2 = [];
  points.getPoint(points.getNumberOfPoints() - 1, worldP2);

  const displayP2 = vtkInteractorObserver.computeWorldToDisplay(
    renderer,
    worldP2[0],
    worldP2[1],
    worldP2[2]
  );

  const xyz = [pickedPosition[0], pickedPosition[1], 0];
  const p1 = [displayP1[0], displayP1[1], 0];
  const p2 = [displayP2[0], displayP2[1], 0];

  const output = vtkLine.distanceToLine(xyz, p1, p2);

  return (
    output.distance <= tolerance * tolerance && output.t < 1.0 && output.t > 0.0
  );
}

function displayToWorld(displayPosition, renderer) {
  const activeCamera = renderer.getActiveCamera();
  const focalPoint = activeCamera.getFocalPoint();

  const displayFocalPoint = vtkInteractorObserver.computeWorldToDisplay(
    renderer,
    focalPoint[0],
    focalPoint[1],
    focalPoint[2]
  );

  const worldEventPosition = vtkInteractorObserver.computeDisplayToWorld(
    renderer,
    displayPosition[0],
    displayPosition[1],
    displayFocalPoint[2]
  );

  return worldEventPosition;
}

function vtkResliceCursorLineRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursorLineRepresentation');

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

  publicAPI.getResliceCursor = () =>
    model.resliceCursorActor.getCursorAlgorithm().getResliceCursor();

  publicAPI.getCursorAlgorithm = () =>
    model.resliceCursorActor.getCursorAlgorithm();

  publicAPI.displayToReslicePlaneIntersection = (displayPosition) => {
    const activeCamera = model.renderer.getActiveCamera();
    const cameraPosition = activeCamera.getPosition();
    const resliceCursor = publicAPI.getResliceCursor();

    const worldEventPosition = displayToWorld(displayPosition, model.renderer);

    if (!resliceCursor) {
      return null;
    }

    const axisNormal = model.resliceCursorActor
      .getCursorAlgorithm()
      .getReslicePlaneNormal();
    const plane = resliceCursor.getPlane(axisNormal);

    const intersection = vtkPlane.intersectWithLine(
      worldEventPosition,
      cameraPosition,
      plane.getOrigin(),
      plane.getNormal()
    );
    return intersection.x;
  };

  publicAPI.computeInteractionState = (displayPos) => {
    model.interactionState = InteractionState.OUTSIDE;

    if (!model.renderer || !model.resliceCursorActor.getVisibility()) {
      return model.interactionState;
    }

    const resliceCursor = publicAPI.getResliceCursor();

    if (!resliceCursor) {
      return model.interactionState;
    }

    const axis1 = model.resliceCursorActor.getCursorAlgorithm().getAxis1();
    const bounds = model.resliceCursorActor
      .getCenterlineActor(axis1)
      .getBounds();

    if (bounds[1] < bounds[0]) {
      return model.interactionState;
    }

    // Picking Axis1 interaction:
    const axis1PolyData = resliceCursor.getCenterlineAxisPolyData(axis1);
    const isAxis1Picked = isAxisPicked(
      model.renderer,
      model.tolerance,
      axis1PolyData,
      displayPos
    );

    // Picking Axis2 interaction:
    const axis2 = model.resliceCursorActor.getCursorAlgorithm().getAxis2();
    const axis2PolyData = resliceCursor.getCenterlineAxisPolyData(axis2);
    const isAxis2Picked = isAxisPicked(
      model.renderer,
      model.tolerance,
      axis2PolyData,
      displayPos
    );

    // Picking center interaction:
    const isCenterPicked = isAxis1Picked && isAxis2Picked;

    if (isCenterPicked) {
      const displayCenterPosition = vtkInteractorObserver.computeWorldToDisplay(
        model.renderer,
        resliceCursor.getCenter()[0],
        resliceCursor.getCenter()[1],
        resliceCursor.getCenter()[2]
      );

      const distance = vtkMath.distance2BetweenPoints(
        [displayCenterPosition[0], displayCenterPosition[1], 0],
        [displayPos[0], displayPos[1], 0]
      );

      if (distance <= model.tolerance * model.tolerance) {
        model.interactionState = InteractionState.ON_CENTER;
      } else {
        model.interactionState = InteractionState.ON_AXIS1;
      }
    } else if (isAxis1Picked) {
      model.interactionState = InteractionState.ON_AXIS1;
    } else if (isAxis2Picked) {
      model.interactionState = InteractionState.ON_AXIS2;
    }

    model.startPickPosition =
      publicAPI.displayToReslicePlaneIntersection(displayPos);

    if (model.startPickPosition === null) {
      model.startPickPosition = [0, 0, 0];
    }

    return model.interactionState;
  };

  publicAPI.startComplexWidgetInteraction = (startEventPos) => {
    model.startEventPosition[0] = startEventPos[0];
    model.startEventPosition[1] = startEventPos[1];
    model.startEventPosition[2] = 0.0;

    const resliceCursor = publicAPI.getResliceCursor();

    if (resliceCursor) {
      model.startCenterPosition = resliceCursor.getCenter();
    }

    model.lastEventPosition[0] = startEventPos[0];
    model.lastEventPosition[1] = startEventPos[1];
    model.lastEventPosition[2] = 0.0;
  };

  publicAPI.complexWidgetInteraction = (displayPosition) => {
    const resliceCursor = publicAPI.getResliceCursor();

    if (
      model.interactionState === InteractionState.OUTSIDE ||
      !model.renderer ||
      !resliceCursor
    ) {
      model.lastEventPosition[0] = displayPosition[0];
      model.lastEventPosition[1] = displayPosition[1];

      return;
    }

    // Depending on the state, perform different operations
    if (model.interactionState === InteractionState.ON_CENTER) {
      const intersectionPos =
        publicAPI.displayToReslicePlaneIntersection(displayPosition);

      if (intersectionPos !== null) {
        const newCenter = [];

        for (let i = 0; i < 3; i++) {
          newCenter[i] =
            model.startCenterPosition[i] +
            intersectionPos[i] -
            model.startPickPosition[i];
        }
        resliceCursor.setCenter(newCenter);
      }
    }

    if (model.interactionState === InteractionState.ON_AXIS1) {
      publicAPI.rotateAxis(
        displayPosition,
        model.resliceCursorActor.getCursorAlgorithm().getPlaneAxis1()
      );
    }

    if (model.interactionState === InteractionState.ON_AXIS2) {
      publicAPI.rotateAxis(
        displayPosition,
        model.resliceCursorActor.getCursorAlgorithm().getPlaneAxis2()
      );
    }

    model.lastEventPosition = [...displayPosition, 0];
  };

  publicAPI.rotateAxis = (displayPos, axis) => {
    const resliceCursor = publicAPI.getResliceCursor();

    if (!resliceCursor) {
      return 0;
    }

    const center = resliceCursor.getCenter();

    // Intersect with the viewing vector. We will use this point and the
    // start event point to compute the rotation angle
    const currentIntersectionPos =
      publicAPI.displayToReslicePlaneIntersection(displayPos);
    const lastIntersectionPos = publicAPI.displayToReslicePlaneIntersection(
      model.lastEventPosition
    );

    if (
      lastIntersectionPos[0] === currentIntersectionPos[0] &&
      lastIntersectionPos[1] === currentIntersectionPos[1] &&
      lastIntersectionPos[2] === currentIntersectionPos[2]
    ) {
      return 0;
    }

    const lastVector = [];
    const currVector = [];

    for (let i = 0; i < 3; i++) {
      lastVector[i] = lastIntersectionPos[i] - center[i];
      currVector[i] = currentIntersectionPos[i] - center[i];
    }

    vtkMath.normalize(lastVector);
    vtkMath.normalize(currVector);

    // Compute the angle between both vectors. This is the amount to
    // rotate by.
    let angle = Math.acos(vtkMath.dot(lastVector, currVector));

    const crossVector = [];
    vtkMath.cross(lastVector, currVector, crossVector);

    const resliceCursorPlaneId = model.resliceCursorActor
      .getCursorAlgorithm()
      .getReslicePlaneNormal();
    const normalPlane = resliceCursor.getPlane(resliceCursorPlaneId);
    const aboutAxis = normalPlane.getNormal();
    const align = vtkMath.dot(aboutAxis, crossVector);
    const sign = align > 0 ? 1.0 : -1.0;
    angle *= sign;

    if (angle === 0) {
      return 0;
    }

    publicAPI.applyRotation(axis, angle);

    return angle;
  };

  publicAPI.applyRotation = (axis, angle) => {
    const resliceCursor = publicAPI.getResliceCursor();
    const resliceCursorPlaneId = model.resliceCursorActor
      .getCursorAlgorithm()
      .getReslicePlaneNormal();

    const planeToBeRotated = resliceCursor.getPlane(axis);
    const viewUp = resliceCursor.getViewUp(axis);
    const vectorToBeRotated = planeToBeRotated.getNormal();

    const normalPlane = resliceCursor.getPlane(resliceCursorPlaneId);
    const aboutAxis = normalPlane.getNormal();

    const rotatedVector = [...vectorToBeRotated];
    vtkMatrixBuilder
      .buildFromRadian()
      .rotate(angle, aboutAxis)
      .apply(rotatedVector);

    vtkMatrixBuilder.buildFromRadian().rotate(angle, aboutAxis).apply(viewUp);

    planeToBeRotated.setNormal(rotatedVector);
  };

  publicAPI.getBounds = () => {
    let bounds = [];
    vtkMath.uninitializeBounds(bounds);

    const resliceCursor = publicAPI.getResliceCursor();

    if (resliceCursor) {
      if (resliceCursor.getImage()) {
        bounds = resliceCursor.getImage().getBounds();
      }
    }

    return bounds;
  };

  publicAPI.getActors = () => {
    // Update representation

    publicAPI.buildRepresentation();

    // Update CameraPosition
    publicAPI.updateCamera();

    return [model.imageActor, ...model.resliceCursorActor.getActors()];
  };

  publicAPI.updateCamera = () => {
    const normalAxis = model.resliceCursorActor
      .getCursorAlgorithm()
      .getReslicePlaneNormal();

    // When the reslice plane is changed, update the camera to look at the
    // normal to the reslice plane always.

    const focalPoint = model.renderer.getActiveCamera().getFocalPoint();
    const position = model.renderer.getActiveCamera().getPosition();
    const normalPlane = publicAPI.getResliceCursor().getPlane(normalAxis);
    const normal = normalPlane.getNormal();

    const distance = Math.sqrt(
      vtkMath.distance2BetweenPoints(position, focalPoint)
    );

    const estimatedCameraPosition = [
      focalPoint[0] + distance * normal[0],
      focalPoint[1] + distance * normal[1],
      focalPoint[2] + distance * normal[2],
    ];

    // intersect with the plane to get updated focal point
    const intersection = vtkPlane.intersectWithLine(
      focalPoint,
      estimatedCameraPosition,
      normalPlane.getOrigin(),
      normalPlane.getNormal()
    );
    const newFocalPoint = intersection.x;

    model.renderer
      .getActiveCamera()
      .setFocalPoint(newFocalPoint[0], newFocalPoint[1], newFocalPoint[2]);

    const newCameraPosition = [
      newFocalPoint[0] + distance * normal[0],
      newFocalPoint[1] + distance * normal[1],
      newFocalPoint[2] + distance * normal[2],
    ];

    model.renderer
      .getActiveCamera()
      .setPosition(
        newCameraPosition[0],
        newCameraPosition[1],
        newCameraPosition[2]
      );

    // Renderer may not have yet actor bounds
    const rendererBounds = model.renderer.computeVisiblePropBounds();
    const bounds = publicAPI.getBounds();
    rendererBounds[0] = Math.min(bounds[0], rendererBounds[0]);
    rendererBounds[1] = Math.max(bounds[1], rendererBounds[1]);
    rendererBounds[2] = Math.min(bounds[2], rendererBounds[2]);
    rendererBounds[3] = Math.max(bounds[3], rendererBounds[3]);
    rendererBounds[4] = Math.min(bounds[4], rendererBounds[4]);
    rendererBounds[5] = Math.max(bounds[5], rendererBounds[5]);

    // Don't clip away any part of the data.
    model.renderer.resetCameraClippingRange(rendererBounds);
  };

  /**
   * Reimplemented to look at image center instead of reslice cursor.
   */
  publicAPI.resetCamera = () => {
    if (model.renderer) {
      const normalAxis = publicAPI.getCursorAlgorithm().getReslicePlaneNormal();
      const normal = publicAPI
        .getResliceCursor()
        .getPlane(normalAxis)
        .getNormal();
      const viewUp = publicAPI.getResliceCursor().getViewUp(normalAxis);
      const focalPoint = model.renderer.getActiveCamera().getFocalPoint();
      const position = model.renderer.getActiveCamera().getPosition();

      // Distance is preserved
      const distance = Math.sqrt(
        vtkMath.distance2BetweenPoints(position, focalPoint)
      );

      const newCameraPosition = [
        focalPoint[0] + distance * normal[0],
        focalPoint[1] + distance * normal[1],
        focalPoint[2] + distance * normal[2],
      ];

      model.renderer
        .getActiveCamera()
        .setPosition(
          newCameraPosition[0],
          newCameraPosition[1],
          newCameraPosition[2]
        );

      model.renderer
        .getActiveCamera()
        .setViewUp(viewUp[0], viewUp[1], viewUp[2]);
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkResliceCursorRepresentation.extend(
    publicAPI,
    model,
    DEFAULT_VALUES,
    initialValues
  );

  model.resliceCursorActor = vtkResliceCursorActor.newInstance({
    parentProp: publicAPI,
  });
  model.startPickPosition = null;
  model.startCenterPosition = null;

  macro.get(publicAPI, model, ['resliceCursorActor']);

  // Object methods
  vtkResliceCursorLineRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkResliceCursorLineRepresentation'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
