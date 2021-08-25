import macro from 'vtk.js/Sources/macros';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import vtkLabelRepresentation from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation';

import { vec3 } from 'gl-matrix';

const { vtkErrorMacro } = macro;

const EPSILON = 1e-6;

function makeBoundsFromPoints(point1, point2) {
  return [
    Math.min(point1[0], point2[0]),
    Math.max(point1[0], point2[0]),
    Math.min(point1[1], point2[1]),
    Math.max(point1[1], point2[1]),
    Math.min(point1[2], point2[2]),
    Math.max(point1[2], point2[2]),
  ];
}

export default function widgetBehavior(publicAPI, model) {
  model.classHierarchy.push('vtkShapeWidgetProp');

  const superClass = { ...publicAPI };

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  publicAPI.setModifierBehavior = (behavior) => {
    Object.assign(model.modifierBehavior, behavior);
  };

  publicAPI.isBehaviorActive = (category, flag) =>
    Object.keys(model.keysDown).some(
      (key) =>
        model.keysDown[key] &&
        model.modifierBehavior[key] &&
        model.modifierBehavior[key][category] === flag
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
          model.modifierBehavior.None[category] === flag)
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
    model.modifierBehavior.None[BehaviorCategory.PLACEMENT] ===
      ShapeBehavior[BehaviorCategory.PLACEMENT].DRAG;

  publicAPI.setVisibleOnFocus = (visibleOnFocus) => {
    model.visibleOnFocus = visibleOnFocus;
  };

  publicAPI.setLabelTextCallback = (callback) => {
    model.labelTextCallback = callback;
  };

  publicAPI.setResetAfterPointPlacement = (reset) => {
    model.resetAfterPointPlacement = reset;
  };

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

      if (model.useHandles) {
        model.point2Handle.setVisible(true);
      }

      publicAPI.updateShapeBounds();

      if (model.visibleOnFocus) {
        model.shapeHandle.setVisible(true);
      }
    }
  };

  publicAPI.placePoint2 = (point2) => {
    if (model.hasFocus) {
      model.point2 = point2;
      model.point2Handle.setOrigin(model.point2);

      publicAPI.updateShapeBounds();

      if (model.resetAfterPointPlacement) {
        publicAPI.reset();
      } else {
        publicAPI.loseFocus();
      }
    }
  };

  publicAPI.setPixelScale = (pixelScale) => {
    model.pixelScale = pixelScale;
    publicAPI.updateHandlesSize();
  };

  publicAPI.updateHandlesSize = () => {
    if (model.pixelScale !== null) {
      const scale =
        model.pixelScale *
        vec3.distance(
          model.apiSpecificRenderWindow.displayToWorld(0, 0, 0, model.renderer),
          model.apiSpecificRenderWindow.displayToWorld(1, 0, 0, model.renderer)
        );

      model.point1Handle.setScale1(scale);
      model.point2Handle.setScale1(scale);
    }
  };

  publicAPI.setVisibility = (visibility) => {
    let modified = false;
    if (model.useHandles) {
      modified = superClass.setVisibility(visibility) || modified;
    } else {
      modified = model.shapeHandle.setVisible(visibility) || modified;
    }

    if (model.label) {
      if (visibility) {
        modified =
          model.label.setContainer(model.interactor.getContainer()) || modified;
      } else {
        modified = model.label.setContainer(null) || modified;
      }
    }
    return modified;
  };

  publicAPI.getLabel = () => model.label;

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

  publicAPI.setCorners = (point1, point2) => {
    if (model.label && model.labelTextCallback) {
      const bounds = makeBoundsFromPoints(point1, point2);
      const screenPoint1 = model.apiSpecificRenderWindow.worldToDisplay(
        ...point1,
        model.renderer
      );
      const screenPoint2 = model.apiSpecificRenderWindow.worldToDisplay(
        ...point2,
        model.renderer
      );
      const screenBounds = [
        Math.min(screenPoint1[0], screenPoint2[0]),
        Math.max(screenPoint1[0], screenPoint2[0]),
        Math.min(screenPoint1[1], screenPoint2[1]),
        Math.max(screenPoint1[1], screenPoint2[1]),
        Math.min(screenPoint1[2], screenPoint2[2]),
        Math.max(screenPoint1[2], screenPoint2[2]),
      ];
      model.labelTextCallback(bounds, screenBounds, model.label);
    }
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

  /*
   * If the widget has the focus, this method reset the widget
   * to it's state just after it grabbed the focus. Otherwise
   * it resets the widget to its state before it grabbed the focus.
   */
  publicAPI.reset = () => {
    if (!model.hasFocus) {
      model.point1Handle.setVisible(false);
    }

    model.shapeHandle.setVisible(false);

    model.point1 = null;
    model.point2 = null;

    if (model.label) {
      model.label.setLabelText('');
    }

    model.point1Handle.setOrigin(model.point2Handle.getOrigin());
    model.point2Handle.setVisible(false);
    model.point2Handle.deactivate();
    if (model.hasFocus) {
      model.point1Handle.activate();
      model.activeState = model.point1Handle;
    } else {
      model.point1Handle.deactivate();
      model.activeState = null;
    }

    publicAPI.updateShapeBounds();
  };

  // --------------------------------------------------------------------------
  // Interactor events
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable ||
      !model.dragable ||
      !model.manipulator
    ) {
      return macro.VOID;
    }
    if (!model.point2) {
      // Update orientation to match the camera's plane
      // if the corners are not yet placed
      const normal = model.camera.getDirectionOfProjection();
      const up = model.camera.getViewUp();
      const right = [];
      vec3.cross(right, up, normal);
      model.shapeHandle.setUp(up);
      model.shapeHandle.setRight(right);
      model.shapeHandle.setDirection(normal);
      model.manipulator.setNormal(normal);
    }
    const worldCoords = model.manipulator.handleEvent(
      callData,
      model.apiSpecificRenderWindow
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
      }
    } else if (model.useHandles && model.isDragging) {
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

    return model.hasFocus ? macro.EVENT_ABORT : macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left click: Add point / End interaction
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    if (
      !model.activeState ||
      !model.activeState.getActive() ||
      !model.pickable
    ) {
      return macro.VOID;
    }

    if (model.hasFocus) {
      if (!model.point1) {
        publicAPI.placePoint1(model.point1Handle.getOrigin());
        publicAPI.invokeStartInteractionEvent();
      } else {
        publicAPI.placePoint2(model.point2Handle.getOrigin());
        publicAPI.invokeInteractionEvent();
        publicAPI.invokeEndInteractionEvent();
      }

      return macro.EVENT_ABORT;
    }

    if (
      model.point1 &&
      (model.activeState === model.point1Handle ||
        model.activeState === model.point2Handle)
    ) {
      model.isDragging = true;
      model.apiSpecificRenderWindow.setCursor('grabbing');
      model.interactor.requestAnimation(publicAPI);
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
      model.apiSpecificRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();

      return macro.EVENT_ABORT;
    }

    if (!model.hasFocus || !model.pickable) {
      return macro.VOID;
    }

    const viewSize = model.apiSpecificRenderWindow.getSize();
    if (
      e.position.x < 0 ||
      e.position.x > viewSize[0] - 1 ||
      e.position.y < 0 ||
      e.position.y > viewSize[1] - 1
    ) {
      return macro.VOID;
    }

    if (model.point1) {
      model.point2 = model.point2Handle.getOrigin();
      publicAPI.updateShapeBounds();

      if (publicAPI.isDraggingEnabled()) {
        const distance = vec3.squaredDistance(model.point1, model.point2);
        const maxDistance = 100;

        if (distance > maxDistance || publicAPI.isDraggingForced()) {
          publicAPI.invokeInteractionEvent();
          publicAPI.invokeEndInteractionEvent();

          if (model.resetAfterPointPlacement) {
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
        publicAPI.invokeEndInteractionEvent();
        publicAPI.reset();
        publicAPI.loseFocus();
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

      if (!model.label) {
        model.label = vtkLabelRepresentation.newInstance();
      }

      model.label.setRenderer(model.renderer);
      model.label.buildRepresentation();
      model.renderer.addViewProp(model.label);
      model.label.setContainer(model.interactor.getContainer());

      model.point1Handle.activate();
      model.activeState = model.point1Handle;

      if (model.useHandles) {
        model.point1Handle.setVisible(true);
      }
      model.shapeHandle.setVisible(false);
      model.interactor.requestAnimation(publicAPI);
    }

    publicAPI.updateHandlesSize();

    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      if (model.visibleOnFocus && !model.useHandles) {
        model.shapeHandle.setVisible(false);
      }
      model.interactor.cancelAnimation(publicAPI);
    }

    if (model.label && !model.useHandles) {
      model.label.setContainer(null);
    }

    if (!model.useHandles || !model.point1) {
      model.point1Handle.setVisible(false);
      model.point2Handle.setVisible(false);
    }

    model.widgetState.deactivate();
    model.point1Handle.deactivate();
    model.point2Handle.deactivate();
    model.activeState = null;
    model.interactor.render();
    model.widgetManager.enablePicking();

    model.hasFocus = false;
  };
}
