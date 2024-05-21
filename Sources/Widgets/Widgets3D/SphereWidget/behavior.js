import macro from 'vtk.js/Sources/macros';
import { add } from 'vtk.js/Sources/Common/Core/Math';
import { vec3 } from 'gl-matrix';

export default function widgetBehavior(publicAPI, model) {
  const state = model.widgetState;
  const moveHandle = state.getMoveHandle();
  const centerHandle = state.getCenterHandle();
  const borderHandle = state.getBorderHandle();
  const shapeHandle = state.getSphereHandle();

  // Set while moving the center or border handle.
  model._isDragging = false;

  model.classHierarchy.push('vtkSphereWidgetProp');

  moveHandle.setVisible(true);
  centerHandle.setVisible(false);
  borderHandle.setVisible(false);
  shapeHandle.setVisible(true);

  function isValidHandle(handle) {
    return (
      handle === centerHandle ||
      handle === borderHandle ||
      handle === moveHandle
    );
  }

  function isPlaced() {
    return !!centerHandle.getOrigin() && !!borderHandle.getOrigin();
  }

  // Update the sphereHandle parameters from {center,border}Handle.
  function updateSphere() {
    const center = centerHandle.getOrigin();
    if (!center) return;

    centerHandle.setVisible(true);
    let border = borderHandle.getOrigin();
    if (border) {
      borderHandle.setVisible(true);
    } else {
      border = moveHandle.getOrigin();
      if (!border) return;
    }
    if (isPlaced()) {
      moveHandle.setVisible(false);
    }
    const radius = vec3.distance(center, border);
    shapeHandle.setVisible(true);
    shapeHandle.setOrigin(center);
    shapeHandle.setScale1(radius * 2);
    model._interactor.render();
  }

  function currentWorldCoords(e) {
    const manipulator =
      model.activeState?.getManipulator?.() ?? model.manipulator;
    return manipulator.handleEvent(e, model._apiSpecificRenderWindow);
  }

  // Update the sphere's center and radius.  Example:
  // handle.setCenterAndRadius([1,2,3], 10);
  publicAPI.setCenterAndRadius = (newCenter, newRadius) => {
    const oldCenter = centerHandle.getOrigin();
    const oldBorder = borderHandle.getOrigin();
    let newBorder = [newCenter[0] + newRadius, newCenter[1], newCenter[2]];
    if (oldBorder) {
      // Move the boundary handle to reflect the new radius, while preserving
      // its direction relative to the center.
      const direction = vec3.sub(vec3.create(), oldBorder, oldCenter);
      const oldRadius = vec3.length(direction);
      if (oldRadius > 1e-10) {
        newBorder = vec3.add(
          vec3.create(),
          newCenter,
          vec3.scale(vec3.create(), direction, newRadius / oldRadius)
        );
      }
    }
    centerHandle.setOrigin(newCenter);
    borderHandle.setOrigin(newBorder);
    updateSphere();
    model._widgetManager.enablePicking();
  };

  publicAPI.handleLeftButtonPress = (e) => {
    if (!isValidHandle(model.activeState)) {
      model.activeState = null;
      return macro.VOID;
    }
    const { worldCoords } = currentWorldCoords(e);

    if (model.activeState === moveHandle) {
      // Initial sphere placement.
      if (!centerHandle.getOrigin()) {
        centerHandle.setOrigin(worldCoords);
      } else if (!borderHandle.getOrigin()) {
        borderHandle.setOrigin(worldCoords);
        publicAPI.loseFocus();
      }
      updateSphere();
      return macro.EVENT_ABORT;
    }

    model._isDragging = true;
    model._apiSpecificRenderWindow.setCursor('grabbing');
    publicAPI.invokeStartInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleLeftButtonRelease = (e) => {
    if (!model._isDragging) {
      model.activeState = null;
      return macro.VOID;
    }
    if (isPlaced()) {
      model._widgetManager.enablePicking();
      model._apiSpecificRenderWindow.setCursor('pointer');
      model._isDragging = false;
      model.activeState = null;
      state.deactivate();
    }
    publicAPI.invokeEndInteractionEvent();
    return macro.EVENT_ABORT;
  };

  publicAPI.handleMouseMove = (e) => {
    if (!model.activeState) return macro.VOID;
    const { worldCoords, worldDelta } = currentWorldCoords(e);

    if (model.hasFocus) {
      model.activeState.setOrigin(worldCoords);
    } else if (model._isDragging) {
      model.activeState.setOrigin(
        add(model.activeState.getOrigin(), worldDelta, [])
      );
    }

    updateSphere();
    return macro.VOID;
  };

  const superGrabFocus = publicAPI.grabFocus;

  publicAPI.grabFocus = () => {
    superGrabFocus();
    moveHandle.setVisible(true);
    centerHandle.setVisible(false);
    borderHandle.setVisible(false);
    centerHandle.setOrigin(null);
    borderHandle.setOrigin(null);
    model.activeState = moveHandle;
    model._interactor.render();
  };

  const superLoseFocus = publicAPI.loseFocus;

  publicAPI.loseFocus = () => {
    superLoseFocus();
    model.activeState = null;
  };
}
