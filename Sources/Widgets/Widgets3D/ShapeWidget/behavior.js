import macro from 'vtk.js/Sources/macro';

import {
  BehaviorCategory,
  ShapeBehavior,
} from 'vtk.js/Sources/Widgets/Widgets3D/ShapeWidget/Constants';

import vtkLabelRepresentation from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation';

import { SlicingMode } from 'vtk.js/Sources/Rendering/Core/ImageMapper/Constants';
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

  const superClass = Object.assign({}, publicAPI);

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

  publicAPI.setXAxis = (xAxis) => {
    vec3.normalize(model.xAxis, xAxis);
  };

  publicAPI.setYAxis = (yAxis) => {
    vec3.normalize(model.yAxis, yAxis);
  };

  publicAPI.setZAxis = (zAxis) => {
    vec3.normalize(model.zAxis, zAxis);
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
      publicAPI.invokeStartInteractionEvent();

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
      publicAPI.invokeInteractionEvent();
      publicAPI.invokeEndInteractionEvent();

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
          model.openGLRenderWindow.displayToWorld(0, 0, 0, model.renderer),
          model.openGLRenderWindow.displayToWorld(1, 0, 0, model.renderer)
        );

      model.point1Handle.setScale1(scale);
      model.point2Handle.setScale1(scale);
    }
  };

  publicAPI.setVisibility = (visibility) => {
    if (model.useHandles) {
      superClass.setVisibility(visibility);
    } else {
      model.shapeHandle.setVisible(visibility);
    }

    if (model.label) {
      if (visibility) {
        model.label.setContainer(model.interactor.getContainer());
      } else {
        model.label.setContainer(null);
      }
    }

    publicAPI.updateRepresentationForRender();
    model.interactor.render();
  };

  publicAPI.getLabel = () => model.label;

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

  publicAPI.setBoundsFromRadius = (center, pointOnCircle) => {
    vtkErrorMacro(
      `${
        model.classHierarchy[model.classHierarchy.length - 1]
      } should implement 'setBoundsFromRadius'`
    );
  };

  publicAPI.setBoundsFromDiameter = (center, pointOnCircle) => {
    vtkErrorMacro(
      `${
        model.classHierarchy[model.classHierarchy.length - 1]
      } should implement 'setBoundsFromDiameter'`
    );
  };

  publicAPI.setBounds = (bounds) => {
    if (model.label && model.labelTextCallback) {
      if (model.point1 && model.point2) {
        const point1 = model.openGLRenderWindow.worldToDisplay(
          bounds[0],
          bounds[2],
          bounds[4],
          model.renderer
        );
        const point2 = model.openGLRenderWindow.worldToDisplay(
          bounds[1],
          bounds[3],
          bounds[5],
          model.renderer
        );
        const screenBounds = [
          point1[0],
          point2[0],
          point1[1],
          point2[1],
          point1[2],
          point2[2],
        ];

        model.labelTextCallback(bounds, screenBounds, model.label);
      }
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
        case ShapeBehavior[BehaviorCategory.POINTS].CORNER_TO_CORNER:
          publicAPI.setBounds(makeBoundsFromPoints(point1, point2));

          break;
        case ShapeBehavior[BehaviorCategory.POINTS].CENTER_TO_CORNER:
          {
            const diagonal = [0, 0, 0];
            vec3.subtract(diagonal, point1, point2);
            vec3.add(point1, point1, diagonal);
          }
          publicAPI.setBounds(makeBoundsFromPoints(point1, point2));

          break;
        case ShapeBehavior[BehaviorCategory.POINTS].RADIUS:
          publicAPI.setBoundsFromRadius(point1, point2);

          break;
        case ShapeBehavior[BehaviorCategory.POINTS].DIAMETER:
          publicAPI.setBoundsFromDiameter(point1, point2);

          break;
        default:
          // This should never be executed
          vtkErrorMacro('vtk internal error');
      }
    } else {
      publicAPI.setBounds([0, 0, 0, 0, 0, 0]);
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
    if (model.manipulator) {
      const worldCoords = model.manipulator.handleEvent(
        callData,
        model.openGLRenderWindow
      );

      if (model.hasFocus && model.pickable) {
        if (worldCoords.length) {
          if (!model.point1) {
            model.point1Handle.setOrigin(worldCoords);
          } else {
            model.point2Handle.setOrigin(worldCoords);
          }
        }

        if (model.point1) {
          model.point2 = worldCoords;
          publicAPI.updateShapeBounds();
        }

        return macro.EVENT_ABORT;
      }

      if (model.useHandles && model.isDragging) {
        if (model.activeState === model.point1Handle) {
          model.point1Handle.setOrigin(worldCoords);
          model.point1 = worldCoords;
        } else {
          model.point2Handle.setOrigin(worldCoords);

          model.point2 = worldCoords;
        }
        publicAPI.updateShapeBounds();

        publicAPI.invokeInteractionEvent();

        return macro.EVENT_ABORT;
      }
    }

    return macro.VOID;
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
      } else {
        publicAPI.placePoint2(model.point2Handle.getOrigin());
      }

      return macro.EVENT_ABORT;
    }

    if (
      model.point1 &&
      (model.activeState === model.point1Handle ||
        model.activeState === model.point2Handle)
    ) {
      model.isDragging = true;
      model.openGLRenderWindow.setCursor('grabbing');
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
      model.openGLRenderWindow.setCursor('pointer');
      model.widgetState.deactivate();
      model.interactor.cancelAnimation(publicAPI);
      publicAPI.invokeEndInteractionEvent();

      return macro.EVENT_ABORT;
    }

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
      model.point2 = model.point2Handle.getOrigin();
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
