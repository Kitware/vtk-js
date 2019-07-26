import macro from 'vtk.js/Sources/macro';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
import { vec3 } from 'gl-matrix';

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

  // --------------------------------------------------------------------------
  // Display 2D
  // --------------------------------------------------------------------------

  publicAPI.setDisplayCallback = (callback) =>
    model.representations[0].setDisplayCallback(callback);

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  publicAPI.setSlicingMode = (slicingMode) => {
    publicAPI.reset();
    const direction = [0, 0, 0];
    direction[slicingMode % 3] = 1;
    model.shapeHandle.setDirection(direction);
    model.manipulator.setNormal(direction);
  };

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

  publicAPI.isRatioFixed = () =>
    publicAPI.isBehaviorActive(
      BehaviorCategory.RATIO,
      ShapeBehavior[BehaviorCategory.RATIO].FIXED
    ) ||
    (!publicAPI.isBehaviorActive(
      BehaviorCategory.RATIO,
      ShapeBehavior[BehaviorCategory.RATIO].FREE
    ) &&
      model.modifierBehavior.None[BehaviorCategory.RATIO] ===
        ShapeBehavior[BehaviorCategory.RATIO].FIXED);

  publicAPI.isCenterToCorner = () =>
    publicAPI.isBehaviorActive(
      BehaviorCategory.POINTS,
      ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER
    ) ||
    (!publicAPI.isBehaviorActive(
      BehaviorCategory.POINTS,
      ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER
    ) &&
      model.modifierBehavior.None[BehaviorCategory.POINTS] ===
        ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER);

  publicAPI.isDraggingEnabled = () =>
    publicAPI.isBehaviorActive(
      BehaviorCategory.PLACEMENT,
      ShapeBehavior[BehaviorCategory.PLACEMENT].DRAG
    ) ||
    publicAPI.isBehaviorActive(
      BehaviorCategory.PLACEMENT,
      ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG
    ) ||
    (!publicAPI.isBehaviorActive(
      BehaviorCategory.PLACEMENT,
      ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK
    ) &&
      (model.modifierBehavior.None[BehaviorCategory.PLACEMENT] ===
        ShapeBehavior[BehaviorCategory.PLACEMENT].DRAG ||
        model.modifierBehavior.None[BehaviorCategory.PLACEMENT] ===
          ShapeBehavior[BehaviorCategory.PLACEMENT].CLICK_AND_DRAG));

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

  publicAPI.setXAxis = (xAxis) => {
    vec3.normalize(model.xAxis, xAxis);
  };

  publicAPI.setYAxis = (yAxis) => {
    vec3.normalize(model.yAxis, yAxis);
  };

  publicAPI.setZAxis = (zAxis) => {
    vec3.normalize(model.zAxis, zAxis);
  };

  // --------------------------------------------------------------------------
  // Private methods
  // --------------------------------------------------------------------------

  publicAPI.makeSquareFromPoints = (point1, point2) => {
    const d = [0, 0, 0];
    vec3.subtract(d, point2, point1);

    let sx = vec3.dot(d, model.xAxis);
    let sy = vec3.dot(d, model.yAxis);
    let sz = vec3.dot(d, model.zAxis);

    const absSx = Math.abs(sx);
    const absSy = Math.abs(sy);
    const absSz = Math.abs(sz);

    const slicingMode = model.shapeHandle.getDirection().indexOf(1);

    if (slicingMode === SlicingMode.I) {
      if (absSy < EPSILON) {
        sy = sz;
      } else if (absSz < EPSILON) {
        sz = sy;
      } else if (absSy > absSz) {
        sz = (sz / absSz) * absSy;
      } else {
        sy = (sy / absSy) * absSz;
      }
    } else if (slicingMode === SlicingMode.J) {
      if (absSx < EPSILON) {
        sx = sz;
      } else if (absSz < EPSILON) {
        sz = sx;
      } else if (absSx > absSz) {
        sz = (sz / absSz) * absSx;
      } else {
        sx = (sx / absSx) * absSz;
      }
    } else if (slicingMode === SlicingMode.K) {
      if (absSx < EPSILON) {
        sx = sy;
      } else if (absSy < EPSILON) {
        sy = sx;
      } else if (absSx > absSy) {
        sy = (sy / absSy) * absSx;
      } else {
        sx = (sx / absSx) * absSy;
      }
    }

    return [
      point1[0] +
        sx * model.xAxis[0] +
        sy * model.yAxis[0] +
        sz * model.zAxis[0],
      point1[1] +
        sx * model.xAxis[1] +
        sy * model.yAxis[1] +
        sz * model.zAxis[1],
      point1[2] +
        sx * model.xAxis[2] +
        sy * model.yAxis[2] +
        sz * model.zAxis[2],
    ];
  };

  publicAPI.updateShapeBounds = () => {
    if (model.point1 && model.point2) {
      const point1 = [...model.point1];
      let point2 = [...model.point2];

      if (publicAPI.isRatioFixed()) {
        point2 = publicAPI.makeSquareFromPoints(point1, point2);
      }

      if (publicAPI.isCenterToCorner()) {
        const diagonal = [0, 0, 0];
        vec3.subtract(diagonal, point1, point2);
        vec3.add(point1, point1, diagonal);
      }

      publicAPI.setBounds(makeBoundsFromPoints(point1, point2));
    } else {
      publicAPI.setBounds([0, 0, 0, 0, 0, 0]);
    }
  };

  publicAPI.reset = () => {
    model.shapeHandle.setVisible(false);
    model.point1 = null;
    model.point2 = null;
    publicAPI.updateShapeBounds();
  };

  // --------------------------------------------------------------------------
  // Interactor events
  // --------------------------------------------------------------------------

  publicAPI.handleMouseMove = (callData) => {
    if (model.hasFocus && model.pickable && model.manipulator) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (worldCoords.length) {
        model.moveHandle.setOrigin(worldCoords);
      }

      if (model.point1) {
        model.point2 = worldCoords;
        publicAPI.updateShapeBounds();
      }

      return macro.EVENT_ABORT;
    }

    return macro.VOID;
  };

  // --------------------------------------------------------------------------
  // Left click: Add point / End interaction
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonPress = (e) => {
    if (!model.hasFocus || !model.pickable) {
      return macro.VOID;
    }

    if (!model.point1) {
      model.point1 = model.moveHandle.getOrigin();
      model.point2 = model.point1;
      publicAPI.updateShapeBounds();
      publicAPI.invokeStartInteractionEvent();

      if (model.visibleOnFocus) {
        model.shapeHandle.setVisible(true);
      }
    } else {
      model.point2 = model.moveHandle.getOrigin();
      publicAPI.updateShapeBounds();
      publicAPI.invokeInteractionEvent();
      publicAPI.invokeEndInteractionEvent();
      publicAPI.reset();
    }

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Left relase: Maybe end interaction
  // --------------------------------------------------------------------------

  publicAPI.handleLeftButtonRelease = (e) => {
    if (!model.hasFocus || !model.pickable) {
      return macro.VOID;
    }

    const viewSize = model.openGLRenderWindow.getSize();
    if (
      e.position.x < 0 ||
      e.position.x > viewSize[0] - 1 ||
      e.position.y < 0 ||
      e.position.y > viewSize[1] - 1
    ) {
      return macro.VOID;
    }

    if (model.point1) {
      model.point2 = model.moveHandle.getOrigin();
      publicAPI.updateShapeBounds();

      if (publicAPI.isDraggingEnabled()) {
        const distance = vec3.squaredDistance(model.point1, model.point2);
        const maxDistance =
          100 *
          Math.max(
            vec3.squaredLength(model.xAxis),
            vec3.squaredLength(model.yAxis),
            vec3.squaredLength(model.zAxis)
          );

        if (distance > maxDistance || publicAPI.isDraggingForced()) {
          publicAPI.invokeInteractionEvent();
          publicAPI.invokeEndInteractionEvent();
          publicAPI.reset();
        }
      }
    }

    return macro.EVENT_ABORT;
  };

  // --------------------------------------------------------------------------
  // Shift key - enforce square
  // --------------------------------------------------------------------------

  publicAPI.handleKeyDown = ({ key }) => {
    if (key === 'Escape') {
      if (model.hasFocus) {
        publicAPI.invokeEndInteractionEvent();
        publicAPI.reset();
      }
    } else {
      model.keysDown[key] = true;
    }

    if (model.hasFocus) {
      if (model.point1) {
        model.point2 = model.moveHandle.getOrigin();
        publicAPI.updateShapeBounds();
      }
    }
  };

  publicAPI.handleKeyUp = ({ key }) => {
    model.keysDown[key] = false;

    if (model.hasFocus) {
      if (model.point1) {
        model.point2 = model.moveHandle.getOrigin();
        publicAPI.updateShapeBounds();
      }
    }
  };

  // --------------------------------------------------------------------------
  // Focus API - moveHandle follow mouse when widget has focus
  // --------------------------------------------------------------------------

  publicAPI.grabFocus = () => {
    if (!model.hasFocus) {
      publicAPI.reset();
      model.moveHandle.activate();
      model.shapeHandle.setVisible(false);
      model.interactor.requestAnimation(publicAPI);
    }

    model.hasFocus = true;
  };

  // --------------------------------------------------------------------------

  publicAPI.loseFocus = () => {
    if (model.hasFocus) {
      if (model.visibleOnFocus) {
        model.shapeHandle.setVisible(false);
      }
      model.interactor.cancelAnimation(publicAPI);
    }

    model.widgetState.deactivate();
    model.moveHandle.deactivate();

    model.hasFocus = false;
  };
}
