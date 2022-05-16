import macro from 'vtk.js/Sources/macros';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import {
  BehaviorCategory,
  ShapeBehavior,
  TextPosition,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import { boundPlane } from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

import { vec3 } from 'gl-matrix';

const { vtkErrorMacro } = macro;

const EPSILON = 1e-6;

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkShapeWidgetProp');

  model.keysDown = {};

  const superClass = { ...publicAPI };

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  publicAPI.setText = (text) => {
    model.widgetState.getText().setText(text);
    // Recompute position
    model._interactor.render();
  };

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------
  publicAPI.setResetAfterPointPlacement =
    model._factory.setResetAfterPointPlacement;
  publicAPI.getResetAfterPointPlacement =
    model._factory.getResetAfterPointPlacement;

  publicAPI.setModifierBehavior = model._factory.setModifierBehavior;
  publicAPI.getModifierBehavior = model._factory.getModifierBehavior;

  publicAPI.isBehaviorActive = (category, flag) =>
    Object.keys(model.keysDown).some(
      (key) =>
        model.keysDown[key] &&
        publicAPI.getModifierBehavior()[key] &&
        publicAPI.getModifierBehavior()[key][category] === flag
    );

  publicAPI.isOppositeBehaviorActive = (category, flag) =>
    Object.values(ShapeBehavior[category]).some(
      (flagToTry) =>
        flag !== flagToTry && publicAPI.isBehaviorActive(category, flagToTry)
    );

  publicAPI.getActiveBehaviorFromCategory = (category) =>
    Object.values(ShapeBehavior[category]).find(
      (flag) =>
        publicAPI.isBehaviorActive(category, flag) ||
        (!publicAPI.isOppositeBehaviorActive(category, flag) &&
          publicAPI.getModifierBehavior().None[category] === flag)
    );

  publicAPI.isRatioFixed = () =>
    publicAPI.getActiveBehaviorFromCategory(BehaviorCategory.RATIO) ===
    ShapeBehavior[BehaviorCategory.RATIO].FIXED;

  publicAPI.isDraggingEnabled = () => {
    const behavior = publicAPI.getActiveBehaviorFromCategory(
      BehaviorCategory.PLACEMENT
    );
    return (
      behavior === ShapeBehavior[BehaviorCategory.PLACEMENT].DRAG ||
      behavior === ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG
    );
  };

  publicAPI.isDraggingForced = () =>
    publicAPI.isBehaviorActive(
      BehaviorCategory.PLACEMENT,
      ShapeBehavior[BehaviorCategory.PLACEMENT].DRAG
    ) ||
    publicAPI.getModifierBehavior().None[BehaviorCategory.PLACEMENT] ===
      ShapeBehavior[BehaviorCategory.PLACEMENT].DRAG;

  publicAPI.getPoint1 = () => model.point1;
  publicAPI.getPoint2 = () => model.point2;

  publicAPI.setPoints = (point1, point2) => {
    model.point1 = point1;
    model.point2 = point2;

    model.point1Handle.setOrigin(model.point1);
    model.point2Handle.setOrigin(model.point2);

    publicAPI.updateShapeBounds();
  };

  // This method is to be called to place the first point
  // for the first time. It is not inlined so that
  // the user can specify himself where the first point
  // is right after publicAPI.grabFocus() without waiting
  // for interactions.
  publicAPI.placePoint1 = (point) => {
    if (model.hasFocus) {
      publicAPI.setPoints(point, point);

      model.point1Handle.deactivate();
      model.point2Handle.activate();
      model.activeState = model.point2Handle;

      model.point2Handle.setVisible(true);
      model.widgetState.getText().setVisible(true);

      publicAPI.updateShapeBounds();

      model.shapeHandle.setVisible(true);
    }
  };

  publicAPI.placePoint2 = (point2) => {
    if (model.hasFocus) {
      model.point2 = point2;
      model.point2Handle.setOrigin(model.point2);

      publicAPI.updateShapeBounds();
    }
  };

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  publicAPI.makeSquareFromPoints = (point1, point2) => {
    const diagonal = [0, 0, 0];
    vec3.subtract(diagonal, point2, point1);
    const dir = model.shapeHandle.getDirection();
    const right = model.shapeHandle.getRight();
    const up = model.shapeHandle.getUp();
    const dirComponent = vec3.dot(diagonal, dir);
    let rightComponent = vec3.dot(diagonal, right);
    let upComponent = vec3.dot(diagonal, up);
    const absRightComponent = Math.abs(rightComponent);
    const absUpComponent = Math.abs(upComponent);

    if (absRightComponent < EPSILON) {
      rightComponent = upComponent;
    } else if (absUpComponent < EPSILON) {
      upComponent = rightComponent;
    } else if (absRightComponent > absUpComponent) {
      upComponent = (upComponent / absUpComponent) * absRightComponent;
    } else {
      rightComponent = (rightComponent / absRightComponent) * absUpComponent;
    }

    return [
      point1[0] +
        rightComponent * right[0] +
        upComponent * up[0] +
        dirComponent * dir[0],
      point1[1] +
        rightComponent * right[1] +
        upComponent * up[1] +
        dirComponent * dir[1],
      point1[2] +
        rightComponent * right[2] +
        upComponent * up[2] +
        dirComponent * dir[2],
    ];
  };

  const getCornersFromRadius = (center, pointOnCircle) => {
    const radius = vec3.distance(center, pointOnCircle);
    const up = model.shapeHandle.getUp();
    const right = model.shapeHandle.getRight();
    const point1 = [
      center[0] + (up[0] - right[0]) * radius,
      center[1] + (up[1] - right[1]) * radius,
      center[2] + (up[2] - right[2]) * radius,
    ];
    const point2 = [
      center[0] + (right[0] - up[0]) * radius,
      center[1] + (right[1] - up[1]) * radius,
      center[2] + (right[2] - up[2]) * radius,
    ];
    return { point1, point2 };
  };

  const getCornersFromDiameter = (point1, point2) => {
    const center = [
      0.5 * (point1[0] + point2[0]),
      0.5 * (point1[1] + point2[1]),
      0.5 * (point1[2] + point2[2]),
    ];

    return getCornersFromRadius(center, point1);
  };

  // TODO: move to ShapeWidget/index.js
  publicAPI.getBounds = () =>
    model.point1 && model.point2
      ? vtkMath.computeBoundsFromPoints(model.point1, model.point2, [])
      : vtkMath.uninitializeBounds([]);

  // To be reimplemented by subclass
  publicAPI.setCorners = (point1, point2) => {
    publicAPI.updateTextPosition(point1, point2);
  };

  publicAPI.updateShapeBounds = () => {
    if (model.point1 && model.point2) {
      const point1 = [...model.point1];
      let point2 = [...model.point2];

      if (publicAPI.isRatioFixed()) {
        point2 = publicAPI.makeSquareFromPoints(point1, point2);
      }

      switch (
        publicAPI.getActiveBehaviorFromCategory(BehaviorCategory.POINTS)
      ) {
        case ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER: {
          publicAPI.setCorners(point1, point2);
          break;
        }
        case ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER: {
          const diagonal = [0, 0, 0];
          vec3.subtract(diagonal, point1, point2);
          vec3.add(point1, point1, diagonal);
          publicAPI.setCorners(point1, point2);
          break;
        }
        case ShapeBehavior[BehaviorCategory.POINTS].RADIUS: {
          const points = getCornersFromRadius(point1, point2);
          publicAPI.setCorners(points.point1, points.point2);
          break;
        }
        case ShapeBehavior[BehaviorCategory.POINTS].DIAMETER: {
          const points = getCornersFromDiameter(point1, point2);
          publicAPI.setCorners(points.point1, points.point2);
          break;
        }
        default:
          // This should never be executed
          vtkErrorMacro('vtk internal error');
      }
    }
  };

  const computePositionVector = (textPosition, minPoint, maxPoint) => {
    const positionVector = [0, 0, 0];
    switch (textPosition) {
      case TextPosition.MIN:
        break;
      case TextPosition.MAX:
        vtkMath.subtract(maxPoint, minPoint, positionVector);
        break;
      case TextPosition.CENTER:
      default:
        vtkMath.subtract(maxPoint, minPoint, positionVector);
        vtkMath.multiplyScalar(positionVector, 0.5);
        break;
    }
    return positionVector;
  };

  const computeTextPosition = (worldBounds, textPosition, worldMargin = 0) => {
    const viewPlaneOrigin = vtkBoundingBox.getCenter(worldBounds);
    const viewPlaneNormal = model._renderer
      .getActiveCamera()
      .getDirectionOfProjection();
    const viewUp = model._renderer.getActiveCamera().getViewUp();

    const positionMargin = Array.isArray(worldMargin)
      ? [...worldMargin]
      : [worldMargin, worldMargin, viewPlaneOrigin ? worldMargin : 0];

    // Map bounds from world positions to display positions
    const minPoint = model._apiSpecificRenderWindow.worldToDisplay(
      ...vtkBoundingBox.getMinPoint(worldBounds),
      model._renderer
    );
    const maxPoint = model._apiSpecificRenderWindow.worldToDisplay(
      ...vtkBoundingBox.getMaxPoint(worldBounds),
      model._renderer
    );
    const displayBounds = vtkMath.computeBoundsFromPoints(
      minPoint,
      maxPoint,
      []
    );

    let planeOrigin = [];
    let p1 = [];
    let p2 = [];
    let p3 = [];

    // If we are in a 2D projection
    if (
      viewPlaneOrigin &&
      viewPlaneNormal &&
      viewUp &&
      vtkBoundingBox.intersectPlane(
        displayBounds,
        viewPlaneOrigin,
        viewPlaneNormal
      )
    ) {
      // Map plane origin from world positions to display positions
      const displayPlaneOrigin = model._apiSpecificRenderWindow.worldToDisplay(
        ...viewPlaneOrigin,
        model._renderer
      );
      // Map plane normal from world positions to display positions
      const planeNormalPoint = vtkMath.add(
        viewPlaneOrigin,
        viewPlaneNormal,
        []
      );
      const displayPlaneNormalPoint =
        model._apiSpecificRenderWindow.worldToDisplay(
          ...planeNormalPoint,
          model._renderer
        );
      const displayPlaneNormal = vtkMath.subtract(
        displayPlaneNormalPoint,
        displayPlaneOrigin
      );

      // Project view plane into bounding box
      const largeDistance =
        10 * vtkBoundingBox.getDiagonalLength(displayBounds);

      vtkPlane.projectPoint(
        vtkBoundingBox.getCenter(displayBounds),
        displayPlaneOrigin,
        displayPlaneNormal,
        planeOrigin
      );

      const planeU = vtkMath.cross(viewUp, displayPlaneNormal, []);
      vtkMath.normalize(planeU); // u
      vtkMath.normalize(viewUp); // v
      vtkMath.normalize(displayPlaneNormal); // w

      vtkMath.multiplyAccumulate(
        planeOrigin,
        viewUp,
        -largeDistance,
        planeOrigin
      );
      vtkMath.multiplyAccumulate(
        planeOrigin,
        planeU,
        -largeDistance,
        planeOrigin
      );

      p1 = vtkMath.multiplyAccumulate(
        planeOrigin,
        planeU,
        2 * largeDistance,
        []
      );
      p2 = vtkMath.multiplyAccumulate(
        planeOrigin,
        viewUp,
        2 * largeDistance,
        []
      );
      p3 = planeOrigin;

      boundPlane(displayBounds, planeOrigin, p1, p2);
    } else {
      planeOrigin = [displayBounds[0], displayBounds[2], displayBounds[4]];
      p1 = [displayBounds[1], displayBounds[2], displayBounds[4]];
      p2 = [displayBounds[0], displayBounds[3], displayBounds[4]];
      p3 = [displayBounds[0], displayBounds[2], displayBounds[5]];
    }

    // Compute horizontal, vertical and depth position
    const u = computePositionVector(textPosition[0], planeOrigin, p1);
    const v = computePositionVector(textPosition[1], planeOrigin, p2);
    const w = computePositionVector(textPosition[2], planeOrigin, p3);

    const finalPosition = planeOrigin;
    vtkMath.add(finalPosition, u, finalPosition);
    vtkMath.add(finalPosition, v, finalPosition);
    vtkMath.add(finalPosition, w, finalPosition);
    vtkMath.add(finalPosition, positionMargin, finalPosition);

    return model._apiSpecificRenderWindow.displayToWorld(
      ...finalPosition,
      model._renderer
    );
  };

  publicAPI.updateTextPosition = (point1, point2) => {
    const bounds = vtkMath.computeBoundsFromPoints(point1, point2, []);
    const screenPosition = computeTextPosition(
      bounds,
      model.widgetState.getTextPosition(),
      model.widgetState.getTextWorldMargin()
    );
    const textHandle = model.widgetState.getText();
    textHandle.setOrigin(screenPosition);
  };

  /*
   * If the widget has the focus, this method reset the widget
   * to it's state just after it grabbed the focus. Otherwise
   * it resets the widget to its state before it grabbed the focus.
   */
  publicAPI.reset = () => {
    model.point1 = null;
    model.point2 = null;

    model.widgetState.getText().setVisible(false);

    model.point1Handle.setOrigin(null);
    model.point2Handle.setOrigin(null);
    model.shapeHandle.setOrigin(null);

    model.shapeHandle.setVisible(false);
    model.point2Handle.setVisible(false);
    model.point2Handle.deactivate();

    if (model.hasFocus) {
      model.point1Handle.activate();
      model.activeState = model.point1Handle;
    } else {
      model.point1Handle.setVisible(false);
      model.point1Handle.deactivate();
      model.activeState = null;
    }

    publicAPI.updateShapeBounds();
  };

  // --------------------------------------------------------------------------
  // Interactor events
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    if (
      !manipulator ||
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      !model.dragable
    ) {
      return macro.VOID;
    }
    if (!model.point2) {
      // Update orientation to match the camera's plane
      // if the corners are not yet placed
      const normal = model._camera.getDirectionOfProjection();
      const up = model._camera.getViewUp();
      const right = [];
      vec3.cross(right, up, normal);
      model.shapeHandle.setUp(up);
      model.shapeHandle.setRight(right);
      model.shapeHandle.setDirection(normal);
    }
    const worldCoords = manipulator.handleEvent(
      callData,
      model._apiSpecificRenderWindow
    );
    if (!worldCoords.length) {
      return macro.VOID;
    }

    if (model.hasFocus) {
      if (!model.point1) {
        model.point1Handle.setOrigin(worldCoords);
      } else {
        model.point2Handle.setOrigin(worldCoords);
        model.point2 = worldCoords;
        publicAPI.updateShapeBounds();
        publicAPI.invokeInteractionEvent();
      }
    } else if (model.isDragging) {
      if (model.activeState === model.point1Handle) {
        model.point1Handle.setOrigin(worldCoords);
        model.point1 = worldCoords;
      } else {
        model.point2Handle.setOrigin(worldCoords);
        model.point2 = worldCoords;
      }
      publicAPI.updateShapeBounds();
      publicAPI.invokeInteractionEvent();
    }

    return model.hasFocus || model.isDragging ? macro.EVENT_ABORT : macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left click: Add point / End interaction
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      !manipulator
    ) {
      return macro.VOID;
    }

    if (model.hasFocus) {
      const worldCoords = manipulator.handleEvent(
        e,
        model._apiSpecificRenderWindow
      );
      if (!model.point1) {
        model.point1Handle.setOrigin(worldCoords);
        publicAPI.placePoint1(model.point1Handle.getOrigin());
        publicAPI.invokeStartInteractionEvent();
      } else {
        model.point2Handle.setOrigin(worldCoords);
        publicAPI.placePoint2(model.point2Handle.getOrigin());
        publicAPI.invokeInteractionEvent();
        publicAPI.invokeEndInteractionEvent();

        if (publicAPI.getResetAfterPointPlacement()) {
          publicAPI.reset();
        } else {
          publicAPI.loseFocus();
        }
      }

      return macro.EVENT_ABORT;
    }

    if (
      model.point1 &&
      (model.activeState === model.point1Handle ||
        model.activeState === model.point2Handle)
    ) {
      model.isDragging = true;
      model._apiSpecificRenderWindow.setCursor('grabbing');
      model._interactor.requestAnimation(publicAPI);
      publicAPI.invokeStartInteractionEvent();

      return macro.EVENT_ABORT;
    }

    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left release: Maybe end interaction
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = (e) => {
    if (model.isDragging) {
      model.isDragging = false;
      model._apiSpecificRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model._interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();

      return macro.EVENT_ABORT;
    }

    if (!model.hasFocus || !model.pickable) {
      return macro.VOID;
    }

    const viewSize = model._apiSpecificRenderWindow.getSize();
    if (
      e.position.x < 0 ||
      e.position.x > viewSize[0] - 1 ||
      e.position.y < 0 ||
      e.position.y > viewSize[1] - 1
    ) {
      return macro.VOID;
    }

    if (model.point1) {
      publicAPI.placePoint2(model.point2Handle.getOrigin());

      if (publicAPI.isDraggingEnabled()) {
        const distance = vec3.squaredDistance(model.point1, model.point2);
        const maxDistance = 100;

        if (distance > maxDistance || publicAPI.isDraggingForced()) {
          publicAPI.invokeInteractionEvent();
          publicAPI.invokeEndInteractionEvent();

          if (publicAPI.getResetAfterPointPlacement()) {
            publicAPI.reset();
          } else {
            publicAPI.loseFocus();
          }
        }
      }
    }

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Register key presses/releases
  // --------------------------------------------------------------------------

  publicAPI.handleKeyDown = ({ key }) => {
    if (key === 'Escape') {
      if (model.hasFocus) {
        publicAPI.reset();
        publicAPI.loseFocus();
        publicAPI.invokeEndInteractionEvent();
      }
    } else {
      model.keysDown[key] = true;
    }

    if (model.hasFocus) {
      if (model.point1) {
        model.point2 = model.point2Handle.getOrigin();
        publicAPI.updateShapeBounds();
      }
    }
  };

  publicAPI.handleKeyUp = ({ key }) => {
    model.keysDown[key] = false;

    if (model.hasFocus) {
      if (model.point1) {
        model.point2 = model.point2Handle.getOrigin();
        publicAPI.updateShapeBounds();
      }
    }
  };

  // --------------------------------------------------------------------------
  // Focus API - follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      publicAPI.reset();

      model.point1Handle.activate();
      model.activeState = model.point1Handle;

      model.point1Handle.setVisible(true);
      model.shapeHandle.setVisible(false);
      model._interactor.requestAnimation(publicAPI);
    }

    superClass.grabFocus();
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      model._interactor.cancelAnimation(publicAPI);
    }

    if (!model.point1) {
      model.point1Handle.setVisible(false);
      model.point2Handle.setVisible(false);
    }

    model.widgetState.deactivate();
    model.point1Handle.deactivate();
    model.point2Handle.deactivate();
    model.activeState = null;
    model._interactor.render();
    model._widgetManager.enablePicking();

    superClass.loseFocus();
  };
}
